export function buildProviderResponseFormat(providerId, outputContract) {
  if (!outputContract || outputContract.type !== 'json') return null;

  const schemaPayload = {
    name: outputContract.id,
    strict: true,
    schema: outputContract.schema,
  };

  if (providerId === 'gemini') {
    return {
      response_mime_type: 'application/json',
      response_schema: outputContract.schema,
    };
  }

  if (providerId === 'groq') {
    return {
      type: 'json_schema',
      json_schema: schemaPayload,
    };
  }

  if (providerId === 'openai' || providerId === 'openrouter' || providerId === 'fireworks') {
    return {
      type: 'json_schema',
      json_schema: schemaPayload,
    };
  }

  if (providerId === 'huggingface') {
    return { type: 'json_object' };
  }

  return { type: 'json_object' };
}
