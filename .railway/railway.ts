import { defineRailway, github, project, service } from "railway/iac";
// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "comptia-security";
export default defineRailway(() => {
  const comptiaSecurity = service("comptia-security", {
    source: github("McCune1224/comptia-security", {
      branch: "main",
      checkSuites: false,
    }),
    build: {
      buildEnvironment: "V3",
      builder: "DOCKERFILE",
      dockerfilePath: "Dockerfile",
      watchPatterns: ["/web/**", "/Dockerfile"],
    },
    start: "node build",
    replicas: { "us-east4-eqdc4a": 1 },
  });

  return project("exciting-essence", {
    variables: { managed: false },
    resources: [comptiaSecurity],
  });
});
