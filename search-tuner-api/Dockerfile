FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY search-tuner-api/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
