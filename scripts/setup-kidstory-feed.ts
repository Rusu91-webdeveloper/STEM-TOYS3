console.error(
  "Kidstory uses the owner-approved static stock baseline. " +
    "Do not reactivate its seed file as a recurring feed; use `pnpm supplier:feeds:repair`."
);
process.exitCode = 1;
