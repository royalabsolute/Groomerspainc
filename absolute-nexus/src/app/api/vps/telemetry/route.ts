import { NextRequest, NextResponse } from "next/server";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { auth } from "@/auth";

const execAsync = promisify(exec);

function cpuAverage() {
  let totalIdle = 0;
  let totalTick = 0;
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) {
    return { idle: 0, total: 0 };
  }
  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });
  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage();
    setTimeout(() => {
      const endMeasure = cpuAverage();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      if (totalDifference === 0) {
        resolve(0);
        return;
      }
      const percentageCPU = 100 - Math.round((100 * idleDifference) / totalDifference);
      resolve(Math.min(100, Math.max(0, percentageCPU)));
    }, 100);
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    // RAM Metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsagePct = ((usedMem / totalMem) * 100).toFixed(1);
    const ramUsedGB = (usedMem / (1024 * 1024 * 1024)).toFixed(1);
    const ramTotalGB = (totalMem / (1024 * 1024 * 1024)).toFixed(1);

    // CPU Metrics
    const cpuUsagePct = await getCpuUsage();

    // Processes List
    let processes: Array<{ pid: number; name: string; mem: number; cpu: number }> = [];
    const isWindows = process.platform === "win32";

    if (isWindows) {
      // Mock processes for Windows local testing
      // Adding slight variation for realism in charts/polling
      const variation = () => parseFloat((Math.random() * 2 - 1).toFixed(1));
      processes = [
        { pid: 2110, name: "java.exe (Minecraft)", mem: parseFloat((25.4 + variation() * 0.1).toFixed(1)), cpu: parseFloat((45.2 + variation() * 2).toFixed(1)) },
        { pid: 1452, name: "node.exe (Next.js)", mem: parseFloat((4.2 + variation() * 0.05).toFixed(1)), cpu: parseFloat((12.5 + variation() * 0.8).toFixed(1)) },
        { pid: 18992, name: "chrome.exe", mem: parseFloat((6.8 + variation() * 0.1).toFixed(1)), cpu: parseFloat((5.2 + variation() * 0.5).toFixed(1)) },
        { pid: 900, name: "postgres.exe", mem: parseFloat((1.8 + variation() * 0.02).toFixed(1)), cpu: parseFloat((0.8 + variation() * 0.1).toFixed(1)) },
        { pid: 3200, name: "explorer.exe", mem: 2.1, cpu: 1.1 },
        { pid: 144, name: "svchost.exe", mem: 0.5, cpu: 0.2 },
        { pid: 1210, name: "Discord.exe", mem: 3.1, cpu: 1.5 },
        { pid: 4322, name: "Code.exe (VS Code)", mem: 8.5, cpu: 2.4 },
        { pid: 5600, name: "System", mem: 0.1, cpu: 0.5 },
        { pid: 9811, name: "Docker Desktop", mem: 11.2, cpu: 1.2 }
      ];
      // Sort mock processes by cpu usage descending
      processes.sort((a, b) => b.cpu - a.cpu);
    } else {
      try {
        const { stdout } = await execAsync("ps -eo pid,comm,%mem,%cpu --sort=-%cpu | head -n 15");
        const lines = stdout.trim().split("\n");
        // Header: PID COMMAND %MEM %CPU
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const parts = line.split(/\s+/);
          if (parts.length >= 4) {
            const pid = parseInt(parts[0], 10);
            const name = parts[1];
            const mem = parseFloat(parts[2]);
            const cpu = parseFloat(parts[3]);
            processes.push({ pid, name, mem, cpu });
          }
        }
      } catch (err) {
        console.error("Error executing ps command:", err);
      }
    }

    return NextResponse.json({
      success: true,
      telemetry: {
        cpuUsage: cpuUsagePct,
        ramUsedGB: parseFloat(ramUsedGB),
        ramTotalGB: parseFloat(ramTotalGB),
        ramUsage: parseFloat(ramUsagePct)
      },
      processes
    });
  } catch (error) {
    console.error("Telemetry API error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
