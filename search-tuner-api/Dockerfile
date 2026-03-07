FROM eclipse-temurin:21-jre-jammy
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
WORKDIR /app
COPY search-tuner-api/build/libs/*.jar app.jar
RUN chown appuser:appgroup app.jar
USER appuser
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/status || exit 1
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
