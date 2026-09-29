package docs

import (
	_ "embed"

	"github.com/go-openapi/swag"
)

// OpenAPI contains the OpenAPI 3.0 contract in YAML format.
//
//go:embed openapi.yaml
var OpenAPI []byte

// OpenAPIJSON converts the embedded OpenAPI YAML spec to valid JSON bytes.
func OpenAPIJSON() ([]byte, error) {
	doc, err := swag.BytesToYAMLDoc(OpenAPI)
	if err != nil {
		return nil, err
	}
	return swag.YAMLToJSON(doc)
}
