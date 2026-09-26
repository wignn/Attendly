package config

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port            string
	Env             string
	AppName         string
	DatabaseURL     string
	RedisURL        string
	RedisAddr       string
	RedisPass       string
	JWTSecret       string
	SuperAdminEmail string
	JWTAccessTTL    time.Duration
	JWTRefreshTTL   time.Duration
	GoogleClientID  string
}

func Load() *Config {
	loadProjectEnvFile()

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
		Port:            port,
		Env:             env,
		AppName:         appName,
		DatabaseURL:     dbURL,
		RedisURL:        redisURL,
		RedisAddr:       redisHost + ":" + redisPort,
		RedisPass:       redisPass,
		JWTSecret:       jwtSecret,
		SuperAdminEmail: strings.ToLower(strings.TrimSpace(getEnv("SUPER_ADMIN_EMAIL", ""))),
		JWTAccessTTL:    time.Duration(accessTTLMinutes) * time.Minute,
		JWTRefreshTTL:   time.Duration(refreshTTLDays) * 24 * time.Hour,
		GoogleClientID:  getEnv("GOOGLE_CLIENT_ID", ""),
	}
}

func loadProjectEnvFile() {
	cwd, err := os.Getwd()
	if err != nil {
		return
	}

	for dir := cwd; ; dir = filepath.Dir(dir) {
		if err := loadEnvFile(filepath.Join(dir, ".env")); err == nil {
			return
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return
		}
	}
}

func loadEnvFile(path string) error {
	return godotenv.Load(path)
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return defaultVal
}
