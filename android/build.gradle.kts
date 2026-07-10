allprojects {
    repositories {
        google()
        mavenCentral()
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
    project.evaluationDependsOn(":app")
    
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
