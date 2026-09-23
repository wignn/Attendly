package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port          string
	Env           string
	AppName       string
	DatabaseURL   string
	RedisURL      string
	RedisAddr     string
	RedisPass     string
	JWTSecret     string
	JWTAccessTTL  time.Duration
	JWTRefreshTTL time.Duration
}

func Load() *Config {
	port := getEnv("PORT", "8080")
	env := getEnv("ENV", "development")
	appName := getEnv("APP_NAME", "komas-api")

	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPass := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "komas_db")
	dbSSL := getEnv("DB_SSLMODE", "disable")

	dbURL := getEnv("DATABASE_URL", "postgres://"+dbUser+":"+dbPass+"@"+dbHost+":"+dbPort+"/"+dbName+"?sslmode="+dbSSL)

	redisURL := getEnv("REDIS_URL", "")
	redisHost := getEnv("REDIS_HOST", "localhost")
	redisPort := getEnv("REDIS_PORT", "6379")
	redisPass := getEnv("REDIS_PASSWORD", "")

	jwtSecret := getEnv("JWT_SECRET", "super-secret-jwt-key-for-development-must-be-32-bytes")
	accessTTLMinutes, _ := strconv.Atoi(getEnv("JWT_ACCESS_TTL_MINUTES", "15"))
	refreshTTLDays, _ := strconv.Atoi(getEnv("JWT_REFRESH_TTL_DAYS", "7"))

	return &Config{
		Port:          port,
		Env:           env,
		AppName:       appName,
		DatabaseURL:   dbURL,
		RedisURL:      redisURL,
		RedisAddr:     redisHost + ":" + redisPort,
		RedisPass:     redisPass,
		JWTSecret:     jwtSecret,
		JWTAccessTTL:  time.Duration(accessTTLMinutes) * time.Minute,
		JWTRefreshTTL: time.Duration(refreshTTLDays) * 24 * time.Hour,
	}
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return defaultVal
}
