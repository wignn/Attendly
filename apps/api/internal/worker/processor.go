package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/hibiken/asynq"
)

type TaskProcessor interface {
	Start() error
	ProcessWelcomeEmail(ctx context.Context, task *asynq.Task) error
}

type RedisTaskProcessor struct {
	server *asynq.Server
	logger *slog.Logger
}

func NewRedisTaskProcessor(redisOpt asynq.RedisClientOpt, logger *slog.Logger) TaskProcessor {
	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency: 10,
			Queues: map[string]int{
				"critical": 6,
				"default":  3,
				"low":      1,
			},
		},
	)
	return &RedisTaskProcessor{server: server, logger: logger}
}

func (p *RedisTaskProcessor) ProcessWelcomeEmail(ctx context.Context, task *asynq.Task) error {
	var payload WelcomeEmailPayload
	if err := json.Unmarshal(task.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", asynq.SkipRetry)
	}

	p.logger.Info("Processing welcome email task", "email", payload.Email, "name", payload.Name)
	// SMTP / Mailer integration happens here
	return nil
}

func (p *RedisTaskProcessor) Start() error {
	mux := asynq.NewServeMux()
	mux.HandleFunc(TypeWelcomeEmail, p.ProcessWelcomeEmail)
	return p.server.Run(mux)
}
