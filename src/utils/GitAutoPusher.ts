/**
 * Project: Gungnir - Git Auto Pusher
 *
 * Automatically pushes obfuscator updates to GitHub after each build.
 * Implements the CI/CD requirement:
 * - Check git status for uncommitted changes
 * - If changes exist: git add . + git commit + git push origin main
 * - Log push results
 * - Configurable via config file (enabled by default)
 *
 * Part of the automated CI/CD pipeline requirement.
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface GitPushResult {
  success: boolean;
  committed: boolean;
  pushed: boolean;
  commitHash?: string;
  message: string;
  timestamp: number;
}

export class GitAutoPusher {
  private repoPath: string;
  private enabled: boolean;
  private remote: string;
  private branch: string;

  constructor(repoPath: string, options?: {
    enabled?: boolean;
    remote?: string;
    branch?: string;
  }) {
    this.repoPath = repoPath;
    this.enabled = options?.enabled ?? true;
    this.remote = options?.remote ?? 'origin';
    this.branch = options?.branch ?? 'main';
  }

  /**
   * Check if there are uncommitted changes in the repository.
   */
  hasUncommittedChanges(): boolean {
    try {
      const status = execSync('git status --porcelain', {
        cwd: this.repoPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return status.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get the current git status summary.
   */
  getStatusSummary(): string {
    try {
      return execSync('git status --short', {
        cwd: this.repoPath,
        encoding: 'utf-8',
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Execute the full auto-push workflow:
   * 1. Check for uncommitted changes
   * 2. If changes exist: git add .
   * 3. git commit with timestamp message
   * 4. git push origin main
   * 5. Log results
   */
  autoPush(customMessage?: string): GitPushResult {
    const timestamp = Date.now();
    const result: GitPushResult = {
      success: false,
      committed: false,
      pushed: false,
      message: '',
      timestamp,
    };

    if (!this.enabled) {
      result.message = 'Auto-push disabled in configuration';
      result.success = true; // Not an error, just disabled
      this.logResult(result);
      return result;
    }

    try {
      // Step 1: Check for changes
      if (!this.hasUncommittedChanges()) {
        result.message = 'No uncommitted changes - nothing to push';
        result.success = true;
        this.logResult(result);
        return result;
      }

      // Step 2: git add .
      execSync('git add .', {
        cwd: this.repoPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Step 3: git commit
      const dateStr = new Date(timestamp).toISOString();
      const commitMessage = customMessage || `chore: auto-update obfuscator [${dateStr}]`;
      execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
        cwd: this.repoPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      result.committed = true;

      // Get commit hash
      try {
        result.commitHash = execSync('git rev-parse HEAD', {
          cwd: this.repoPath,
          encoding: 'utf-8',
        }).trim().slice(0, 8);
      } catch {
        result.commitHash = 'unknown';
      }

      // Step 4: git push
      execSync(`git push ${this.remote} ${this.branch}`, {
        cwd: this.repoPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      result.pushed = true;
      result.success = true;
      result.message = `Successfully pushed commit ${result.commitHash} to ${this.remote}/${this.branch}`;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      result.message = `Push failed: ${errorMsg}`;
      result.success = false;
    }

    this.logResult(result);
    return result;
  }

  /**
   * Log push results to a log file.
   */
  private logResult(result: GitPushResult): void {
    try {
      const logDir = path.join(this.repoPath, '.gungnir-logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const logFile = path.join(logDir, 'git-push.log');
      const logEntry = JSON.stringify({
        ...result,
        date: new Date(result.timestamp).toISOString(),
      }) + '\n';
      fs.appendFileSync(logFile, logEntry, 'utf-8');
    } catch {
      // Logging failure should not break the push
    }
  }

  /**
   * Read recent push logs.
   */
  getPushLogs(limit: number = 10): GitPushResult[] {
    try {
      const logFile = path.join(this.repoPath, '.gungnir-logs', 'git-push.log');
      if (!fs.existsSync(logFile)) return [];
      const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');
      return lines.slice(-limit).map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter((r): r is GitPushResult => r !== null);
    } catch {
      return [];
    }
  }

  /**
   * Update version.json with current build info.
   * Called before push to ensure web page shows latest version.
   */
  updateVersionFile(version?: string): void {
    try {
      const versionFile = path.join(this.repoPath, 'version.json');
      const buildDate = new Date().toISOString();
      const versionData = {
        version: version || `1.0.${Math.floor(Date.now() / 86400000) % 1000}`,
        buildDate,
        timestamp: Date.now(),
        commit: this.getCurrentCommitHash(),
      };
      fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2), 'utf-8');
    } catch {
      // Version file update is non-critical
    }
  }

  /**
   * Get current commit hash (short).
   */
  getCurrentCommitHash(): string {
    try {
      return execSync('git rev-parse --short HEAD', {
        cwd: this.repoPath,
        encoding: 'utf-8',
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if remote is reachable.
   */
  isRemoteReachable(): boolean {
    try {
      execSync(`git ls-remote ${this.remote} HEAD`, {
        cwd: this.repoPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      });
      return true;
    } catch {
      return false;
    }
  }
}
