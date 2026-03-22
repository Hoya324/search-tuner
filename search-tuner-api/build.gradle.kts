plugins {
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
}

dependencyManagement {
    imports {
        mavenBom("org.springframework.ai:spring-ai-bom:${libs.versions.spring.ai.get()}")
    }
}

dependencies {
    implementation(project(":search-tuner-core"))
    implementation(project(":search-tuner-infra-persistence"))
    implementation(project(":search-tuner-infra-es"))
    implementation(project(":search-tuner-infra-llm"))
    implementation(project(":search-tuner-infra-llm-gemini"))
    implementation(project(":search-tuner-infra-llm-openai"))
    implementation(project(":search-tuner-infra-llm-claude"))

    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.kotlin.reflect)
    implementation(libs.jackson.module.kotlin)
    implementation(libs.jackson.dataformat.yaml)
    implementation(libs.springdoc.openapi.webmvc)

    runtimeOnly(libs.mysql.connector.j)
    implementation("com.opencsv:opencsv:5.9")

    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.kotlin.test.junit5)
    testRuntimeOnly(libs.junit.platform.launcher)
}

tasks.named<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
    val envFile = rootProject.file(".env")
    if (envFile.exists()) {
        envFile.readLines()
            .filter { it.isNotBlank() && !it.startsWith("#") && it.contains("=") }
            .map { it.split("=", limit = 2) }
            .forEach { (key, value) -> environment(key, value) }
    }
}
