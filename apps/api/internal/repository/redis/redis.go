package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type Client struct {
	rdb *redis.Client
}

func New(rawURL, addr, password string) (*Client, error) {
	var opts *redis.Options
	var err error

	if rawURL != "" {
		opts, err = redis.ParseURL(rawURL)
		if err != nil {
			return nil, fmt.Errorf("invalid redis url: %w", err)
		}
	} else {
		opts = &redis.Options{
			Addr:     addr,
			Password: password,
			DB:       0,
		}
	}

	rdb := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping failed: %w", err)
	}

	return &Client{rdb: rdb}, nil
}

func (c *Client) Set(ctx context.Context, key string, value any, expiration time.Duration) error {
	return c.rdb.Set(ctx, key, value, expiration).Err()
}

func (c *Client) Get(ctx context.Context, key string) (string, error) {
	return c.rdb.Get(ctx, key).Result()
}

func (c *Client) Del(ctx context.Context, keys ...string) error {
	return c.rdb.Del(ctx, keys...).Err()
}

// Allow implements a fixed-window rate limiter. Returns true if request is allowed.
func (c *Client) Allow(ctx context.Context, key string, limit int64, window time.Duration) (bool, error) {
	if c == nil || c.rdb == nil {
		return true, nil
	}

	count, err := c.rdb.Incr(ctx, key).Result()
	if err != nil {
		return true, err
	}

	if count == 1 {
		_ = c.rdb.Expire(ctx, key, window).Err()
	}

	return count <= limit, nil
}

func (c *Client) Client() *redis.Client {
	return c.rdb
}

func (c *Client) Close() error {
	if c == nil || c.rdb == nil {
		return nil
	}
	return c.rdb.Close()
}
