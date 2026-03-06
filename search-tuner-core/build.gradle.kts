dependencies {
    implementation(libs.kotlin.reflect)
    implementation(libs.commons.math3)

    testImplementation(libs.kotlin.test.junit5)
    testRuntimeOnly(libs.junit.platform.launcher)
}
