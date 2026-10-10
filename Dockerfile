FROM maven:3.9-eclipse-temurin-17@sha256:1a352420f7aba21f5ad08df31bab55f74c013fb491f1ae8ab1dd7ff9ed698584 AS build
WORKDIR /build
COPY pom.xml ./
COPY src ./src
RUN mvn -B -DskipTests clean package

FROM eclipse-temurin:17-jre-jammy@sha256:8993f1aed8b25fcea7a7047a7949c1866fa558fc6830d938c22c4f13b26be9d7
WORKDIR /app
COPY --from=build /build/target/campus-booking-hub-0.0.1-SNAPSHOT.jar /app/app.jar
USER 10001:10001
EXPOSE 10000
CMD ["java", "-jar", "/app/app.jar"]
