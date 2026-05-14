package executor

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"time"
)

type ExecutionResult struct {
	Success bool   `json:"success"`
	Output  string `json:"output"`
	Error   string `json:"error"`
}

const (
	maxOutputSize     = 1024 * 1024
	executionTimeout  = 10 * time.Second
	maxConcurrentRuns = 5
)

var concurrencyFlag = make(chan bool, maxConcurrentRuns)

type limitedBuffer struct {
	Buffer *bytes.Buffer
	Max    int
  Cancel context.CancelFunc
}

// our struct limitedBuffer implements io.Writer interface
func (l *limitedBuffer) Write(p []byte) (int, error) {
  remaining := l.Max - l.Buffer.Len()

  if remaining <= 0 {
    l.Cancel()
    return 0, errors.New("output limit exceeded")
  }

  if len(p) > remaining {
    l.Buffer.Write(p[:remaining])
    l.Cancel()
    return 0, errors.New("output limit exceeded")
  }
	return l.Buffer.Write(p)
}

func ExecuteCode(code string) *ExecutionResult {
	concurrencyFlag <- true
	defer func() { <-concurrencyFlag }()

	// create a unique rust-code-sandbox-* directory prbably for each request under /tmp directory
	tmpDir, err := os.MkdirTemp("", "rust-code-sandbox-*")
	if err != nil {
		fmt.Println("Error while creating tmp/rust-code-sandbox-* directory: %w", err)
		return fail(fmt.Errorf("Something's wrong"))
	}

	// remove the tmp directory after returning the function
	defer os.RemoveAll(tmpDir)

	mainFile := filepath.Join(tmpDir, "main.rs")
	if err := os.WriteFile(mainFile, []byte(code), 0644); err != nil {
		fmt.Println("Failed to write the code to main.rs file in tmp directory /tmp/rust-code-sandbox-*: %w", err)
		return fail(fmt.Errorf("Something's wrong"))
	}

	// context with 10 seconds timeout
	ctx, cancel := context.WithTimeout(context.Background(), executionTimeout)
	defer cancel()
  containerName := fmt.Sprintf("rust-sandbox-%d", time.Now().UnixNano())

	cmd := exec.CommandContext(
		ctx,
		"docker", "run",
		"--rm",
    "--name", containerName,
		"--memory=128m",
		"--memory-swap=128m",
		"--cpus=0.5",
		"--pids-limit=64",
		"--network=none",
		"--read-only",
		"--cap-drop=ALL",                            // removes some linux abilities like admin related commands, accessing sockets etc
    "--security-opt=no-new-privileges",          // block more stuffs to execute like any command sudo privileges will be blocked, cannot be able to access passwd kinda file etc
		"--tmpfs", "/tmp:rw,noexec,nosuid,size=16m", // in-memory storage, so the tmp directory that am creating on line 57 
                                                 // will be on memory instead of disc so that it will get deleted after the container exits
		"-v", tmpDir+":/app:rw",
		"-w", "/app",
		"rust-code-sandbox",
		"sh", "-c", "rustc main.rs -O -o main && ./main",
	)

	// kill all the process including sub process(if someone sends a rust code to my shitty executor which
  // contains child processes rust code)
  // initially i thought it will delete the docker container itself, but i was wrong
  // the process that go starts it just the docker cli
  // the docker cli is the one with starts the daemon and docker containers
  // so this code deletes only the docker cli and not the docker container, so am
  // manually deleting the container below
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setpgid: true,
	}

	var stdout bytes.Buffer
	var stderr bytes.Buffer

  cmd.Stdout = &limitedBuffer{Buffer: &stdout, Max: maxOutputSize, Cancel: cancel}
  cmd.Stderr = &limitedBuffer{Buffer: &stderr, Max: maxOutputSize, Cancel: cancel}

	err = cmd.Start()
	if err != nil {
		fmt.Println("Failed during docker start: %w", err)
		return fail(fmt.Errorf("Something's wrong"))
	}

	done := make(chan error, 1)
	go func() {
		done <- cmd.Wait()
	}()

	select {
	case err := <-done:
		if err != nil {
      exec.Command("docker", "rm", "-f", containerName).Run()
			return &ExecutionResult{
				Success: false,
				Output:  stdout.String(),
				Error:   stderr.String(),
			}
		}
	case <-ctx.Done():
		// kill all the process follow up from line 83, if it exceeds executionTimeout in the context that we created
		_ = syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
    exec.Command("docker", "rm", "-f", containerName).Run()
		return &ExecutionResult{
			Success: false,
			Error:   "Execution timeout",
		}
	}

	return &ExecutionResult{
		Success: true,
		Output:  stdout.String(),
	}
}

func fail(err error) *ExecutionResult {
	return &ExecutionResult{
		Success: false,
		Error:   err.Error(),
	}
}
