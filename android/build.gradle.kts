allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// Automatically patch third-party plugins (google_mobile_ads) for Gradle 8+ compatibility in any environment (CI/CD / GitHub Actions)
subprojects {
    if (name == "google_mobile_ads") {
        val buildFile = file("build.gradle")
        if (buildFile.exists()) {
            val text = buildFile.readText()
            if (text.contains("configurations.all")) {
                buildFile.writeText(text.replace("configurations.all", "configurations"))
            }
        }
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    // Suprimir avisos molestos de plugins de terceros
    tasks.withType<JavaCompile>().configureEach {
        options.compilerArgs.addAll(listOf(
            "-Xlint:-options",      // Suprime 'source value 8 is obsolete'
            "-Xlint:-unchecked",    // Suprime 'unchecked or unsafe operations'
            "-Xlint:-deprecation",  // Suprime 'override a deprecated API'
            "-nowarn",              // Suprime todos los warnings restantes
            "-Xlint:none"           // Otra forma de forzar la supresión
        ))
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
