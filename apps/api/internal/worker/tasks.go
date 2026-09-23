package worker

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const (
	TypeWelcomeEmail = "task:welcome_email"
)

type WelcomeEmailPayload struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

type TaskDistributor interface {
	DistributeWelcomeEmail(ctx context.Context, payload *WelcomeEmailPayload, opts ...asynq.Option) error
}

type RedisTaskDistributor struct {
	client *asynq.Client
}

func NewRedisTaskDistributor(redisOpt asynq.RedisClientOpt) TaskDistributor {
	client := asynq.NewClient(redisOpt)
	return &RedisTaskDistributor{client: client}
}

func (d *RedisTaskDistributor) DistributeWelcomeEmail(ctx context.Context, payload *WelcomeEmailPayload, opts ...asynq.Option) error {
	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	task := asynq.NewTask(TypeWelcomeEmail, jsonPayload, opts...)
	_, err = d.client.EnqueueContext(ctx, task)
	return err
}
