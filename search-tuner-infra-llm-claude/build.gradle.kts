plugins {
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.dependency.management)
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.boot:spring-boot-dependencies:${libs.versions.spring.boot.get()}")
        mavenBom("org.springframework.ai:spring-ai-bom:${libs.versions.spring.ai.get()}")
    }
}

dependencies {
    implementation(project(":search-tuner-infra-llm"))
    implementation("org.springframework.ai:spring-ai-starter-model-anthropic")
    implementation(libs.kotlin.reflect)
}
