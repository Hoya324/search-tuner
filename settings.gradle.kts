rootProject.name = "search-tuner"

include(
    "search-tuner-core",
    "search-tuner-infra-es",
    "search-tuner-infra-llm",
    "search-tuner-infra-llm-gemini",
    "search-tuner-infra-llm-openai",
    "search-tuner-infra-llm-claude",
    "search-tuner-infra-persistence",
    "search-tuner-api"
)
