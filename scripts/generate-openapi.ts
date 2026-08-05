import { getOpenApiSpec } from '../src/shared/openapi';

const spec = getOpenApiSpec();
console.log(JSON.stringify(spec, null, 2));
