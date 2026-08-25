export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertHardenedBoot } = await import("./lib/auth/secrets");
    assertHardenedBoot();
  }
}
