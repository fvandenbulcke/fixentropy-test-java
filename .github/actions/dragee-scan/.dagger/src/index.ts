import {
    dag, object, func, Secret, Directory, File, CacheVolume, Container,
} from "@dagger.io/dagger";
import * as path from "path";

@object()
export class DrageeCi {

    /**
     * Validates and normalizes input parameters using Node.js utilities
     * @param from Path to validate
     * @param asserter Optional asserter to validate
     * @returns Object with validated parameters
     */
    private validateInputs(from: string, asserter?: string): { from: string; asserter?: string } {
        const normalizedFrom = path.posix.normalize(from || ".");
        const normalizedAsserter = asserter?.trim();

        return {
            from: normalizedFrom,
            asserter: normalizedAsserter && normalizedAsserter.length > 0 ? normalizedAsserter : undefined
        };
    }

    /**
     * Builds command arguments using Node.js utilities
     * @param from Path to scan
     * @param grapher Whether to enable grapher mode
     * @returns Array of command arguments
     */
    private buildCommandArgs(from: string, grapher?: boolean): string[] {
        const args = ["/cli/dist/dragee-linux", "report", "--from", path.posix.join("/src", from)];
        return args;
    }

    /**
     * Builds the dragee CLI from the official repository
     * @param githubToken Optional GitHub token for private repository access
     * @returns Directory containing the built CLI with executable at /dist/dragee-linux
     */
    @func()
    async buildCli(
        githubToken?: Secret,
    ): Promise<Directory> {
        const bunCache: CacheVolume = dag.cacheVolume("bun-cache");
        const aptCache: CacheVolume = dag.cacheVolume("apt-cache");

        let ctr: Container = dag.container()
            .from("oven/bun:1.3.3")
            .withMountedCache("/var/cache/apt", aptCache)
            .withExec(["bash", "-lc", "apt-get update && apt-get install -y git ca-certificates"])
            .withWorkdir("/work");

        if (githubToken) ctr = ctr.withSecretVariable("GITHUB_TOKEN", githubToken);

        ctr = ctr
            .withExec(["bash", "-lc", "git clone -b feat/push-report https://$GITHUB_TOKEN@github.com/dragee-io/dragee-cli.git dragee-cli"])
            .withWorkdir("/work/dragee-cli")
            .withMountedCache("/root/.bun", bunCache)
            .withExec(["bun", "install"])
            .withExec(["bun", "run", "build:linux"])
            .withExec(["chmod", "+x", "./dist/dragee-linux"]);

        return ctr.directory("/work/dragee-cli");
    }

    /**
     * Clones a custom asserter repository for local use
     * @param asserter Repository path in format "org/repo"
     * @param githubToken Optional GitHub token for private repository access
     * @returns Directory containing the cloned asserter repository
     */
    @func()
    async fetchAsserter(
        asserter: string,
        githubToken?: Secret,
    ): Promise<Directory> {
        const aptCache: CacheVolume = dag.cacheVolume("apt-cache");

        let ctr = dag.container()
            .from("debian:stable-slim")
            .withMountedCache("/var/cache/apt", aptCache)
            .withExec(["bash", "-lc", "apt-get update && apt-get install -y git ca-certificates"])
            .withWorkdir("/work");

        if (githubToken) ctr = ctr.withSecretVariable("GITHUB_TOKEN", githubToken);

        ctr = ctr.withExec([
            "bash","-lc",
            `git clone "https://$GITHUB_TOKEN@github.com/${asserter}.git" "/tmp/asserters"`
        ]);

        return ctr.directory("/tmp/asserters");
    }

    /**
     * Runs dragee analysis and generates a report
     * @param from Path to scan relative to source directory
     * @param cli Directory containing the built dragee CLI
     * @param oidcToken Required OIDC token for dragee.io uploads
     * @param backendUrl Optional dragee.io backend URL
     * @param asserterDir Optional directory containing custom asserters
     * @param source Optional source directory to scan (defaults to the current module source)
     * @returns File containing the generated dragee report JSON
     */
    @func()
    async runReport(
        from: string,
        cli: Directory,
        oidcToken: Secret,
        backendUrl?: string,
        asserterDir?: Directory,
        source?: Directory,
    ): Promise<File> {
        const src = source ?? dag.currentModule().source().directory(".");
        const aptCache: CacheVolume = dag.cacheVolume("apt-cache");

        let ctr = dag.container()
            .from("oven/bun:1.3.3")
            .withMountedCache("/var/cache/apt", aptCache)
            .withExec(["bash", "-lc", "apt-get update && apt-get install -y ca-certificates curl"])
            .withWorkdir("/work");

        ctr = ctr
            .withMountedDirectory("/src", src)
            .withMountedDirectory("/cli", cli);

        if (asserterDir) {
            ctr = ctr
                .withMountedDirectory("/tmp/asserters", asserterDir)
                .withEnvVariable("DRAGEE_ASSERTER_LOCAL_REGISTRY_PATH", "/tmp/asserters");
        }

        if (oidcToken) {
            ctr = ctr.withEnvVariable("OIDC_TOKEN", await oidcToken.plaintext());
        }

        if (backendUrl) {
            ctr = ctr.withEnvVariable("BACKEND_URL", backendUrl);
        }

        const scanRoot = path.posix.resolve("/", from);
        const args = this.buildCommandArgs(scanRoot);

        ctr = ctr.withExec(args);

        return ctr.file(path.posix.resolve("/", "work", "dragee", "reports", "result.json"));
    }

    /**
     * Complete dragee pipeline that builds CLI, optionally fetches asserters, runs analysis, and uploads results
     * @param from Path to scan relative to source directory
     * @param asserter Optional custom asserter repository in format "org/repo"
     * @param grapher Optional flag to enable grapher mode in the analysis
     * @param githubToken Optional GitHub token for private repository access
     * @param oidcToken Required OIDC token for dragee.io uploads
     * @param backendUrl Optional dragee.io backend URL
     * @param source Optional source directory to scan (defaults to the current module source)
     * @returns Status message indicating completion or local file path
     */
    @func()
    async runPipeline(
        from: string,
        asserter?: string,
        grapher?: boolean,
        githubToken?: Secret,
        oidcToken?: Secret,
        backendUrl?: string,
        source?: Directory,
    ): Promise<string> {
        const { from: validatedFrom, asserter: validatedAsserter } = this.validateInputs(from, asserter);

        const cliDir: Directory = await this.buildCli(githubToken);

        let asserterDir: Directory | undefined = undefined;
        if (validatedAsserter) {
            asserterDir = await this.fetchAsserter(validatedAsserter, githubToken);
        }

        if (!oidcToken) throw new Error("OIDC token is required for dragee.io uploads");

        const scanRoot = path.posix.resolve("/", validatedFrom);

        const reportFile: File = await this.runReport(
            scanRoot,
            cliDir,
            oidcToken,
            backendUrl,
            asserterDir,
            source ?? dag.currentModule().source().directory("."),
        );

        await reportFile.export("dragee-report.json");
        return "dragee-report.json";
    }
}
