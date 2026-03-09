# Build stage
FROM eclipse-temurin:21-jdk-jammy AS build

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends unzip && rm -rf /var/lib/apt/lists/*

# Copy gradle wrapper and build files for dependency caching
COPY gradle/ gradle/
COPY gradlew gradlew.bat settings.gradle.kts build.gradle.kts ./

# Copy module build files (enables dependency layer caching)
COPY search-tuner-core/build.gradle.kts search-tuner-core/
COPY search-tuner-infra-es/build.gradle.kts search-tuner-infra-es/
COPY search-tuner-infra-llm/build.gradle.kts search-tuner-infra-llm/
COPY search-tuner-infra-persistence/build.gradle.kts search-tuner-infra-persistence/
COPY search-tuner-api/build.gradle.kts search-tuner-api/

RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon -q

# Copy source and build
COPY . .
RUN ./gradlew :search-tuner-api:bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/search-tuner-api/build/libs/*.jar app.jar
RUN mkdir -p /logs && chown appuser:appgroup app.jar /logs

USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/status || exit 1

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
