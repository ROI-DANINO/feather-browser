async function main() {
  console.log("Feather Browser service starting...");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
