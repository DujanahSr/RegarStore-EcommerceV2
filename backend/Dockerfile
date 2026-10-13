# Satu Dockerfile untuk semua service: docker build --build-arg SERVICE=auth-service .
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY . .
RUN --mount=type=cache,target=/root/.m2 mvn -B -q package -DskipTests

FROM eclipse-temurin:21-jre-alpine
ARG SERVICE
WORKDIR /app
COPY --from=build /src/${SERVICE}/target/${SERVICE}-1.0.0-SNAPSHOT.jar app.jar
ENV JAVA_TOOL_OPTIONS="-XX:CICompilerCount=2 -Xss256k -Xms32m -Xmx192m"
ENTRYPOINT ["java", "-jar", "app.jar"]
