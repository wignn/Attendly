package docs

import _ "embed"

// OpenAPI contains the manually maintained OpenAPI 3.1 contract.
//
//go:embed openapi.yaml
var OpenAPI []byte
