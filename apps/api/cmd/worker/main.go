package main

import (
	"log"

	"github.com/wignn/komas-api/internal/config"
	"github.com/wignn/komas-api/internal/worker"
	"github.com/wignn/komas-api/pkg/logger"
	"github.com/hibiken/asynq"
)

func main() {
	cfg := config.Load()
	appLogger := logger.New(cfg.Env)

	redisOpt := asynq.RedisClientOpt{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPass,
	}

	processor := worker.NewRedisTaskProcessor(redisOpt, appLogger)
	appLogger.Info("Starting Asynq background worker...")

	if err := processor.Start(); err != nil {
		log.Fatalf("could not run worker processor: %v", err)
	}
}
