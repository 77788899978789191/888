//! Gungnir CLI - 命令行入口
//!
//! 用法：
//! ```bash
//! gungnir-cli input.lua -o output.lua --intensity 10
//! ```

use clap::{Arg, ArgAction, Command};
use gungnir::{Intensity, ObfuscatorConfig, Orchestrator, VERSION};
use std::fs;
use std::time::Instant;

fn build_cli() -> Command {
    Command::new("gungnir-cli")
        .version(VERSION)
        .about("Gungnir - Ultimate Lua 5.1 Obfuscator (200+ techniques)")
        .arg(
            Arg::new("INPUT")
                .help("输入Lua文件路径")
                .required(true)
                .index(1),
        )
        .arg(
            Arg::new("output")
                .short('o')
                .long("output")
                .help("输出文件路径（默认：输入文件名_obfuscated.lua）")
                .value_name("OUTPUT"),
        )
        .arg(
            Arg::new("intensity")
                .short('i')
                .long("intensity")
                .help("混淆强度（1-10，默认：7）")
                .value_name("LEVEL")
                .default_value("7"),
        )
        .arg(
            Arg::new("seed")
                .short('s')
                .long("seed")
                .help("随机种子（默认：自动生成）")
                .value_name("SEED"),
        )
        .arg(
            Arg::new("salt")
                .long("salt")
                .help("用户盐值")
                .value_name("SALT")
                .default_value("gungnir-cli-salt"),
        )
        .arg(
            Arg::new("no-verify")
                .long("no-verify")
                .help("禁用自动验证")
                .action(ArgAction::SetTrue),
        )
        .arg(
            Arg::new("no-parallel")
                .long("no-parallel")
                .help("禁用多线程并行")
                .action(ArgAction::SetTrue),
        )
        .arg(
            Arg::new("verbose")
                .short('v')
                .long("verbose")
                .help("显示详细日志")
                .action(ArgAction::SetTrue),
        )
        .arg(
            Arg::new("stats")
                .long("stats")
                .help("显示统计报告")
                .action(ArgAction::SetTrue),
        )
        .arg(
            Arg::new("config")
                .short('c')
                .long("config")
                .help("配置文件路径（JSON格式）")
                .value_name("CONFIG"),
        )
}

fn main() {
    // 初始化日志
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .format_timestamp_millis()
        .init();

    let matches = build_cli().get_matches();

    let verbose = matches.get_flag("verbose");
    let show_stats = matches.get_flag("stats");

    let input_path: &String = matches
        .get_one("INPUT")
        .expect("INPUT is required");

    if verbose {
        println!("Gungnir CLI v{}", VERSION);
        println!("Input: {}", input_path);
        if let Some(intensity) = matches.get_one::<String>("intensity") {
            println!("Intensity: {}", intensity);
        }
        if let Some(seed) = matches.get_one::<String>("seed") {
            println!("Seed: {}", seed);
        }
    }

    // 构建配置
    let config = if let Some(config_path) = matches.get_one::<String>("config") {
        match fs::read_to_string(config_path) {
            Ok(json) => match ObfuscatorConfig::from_json(&json) {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Error parsing config file: {}", e);
                    std::process::exit(1);
                }
            },
            Err(e) => {
                eprintln!("Error reading config file: {}", e);
                std::process::exit(1);
            }
        }
    } else {
        let mut config = ObfuscatorConfig::default();

        if let Some(intensity_str) = matches.get_one::<String>("intensity") {
            if let Ok(level) = intensity_str.parse::<u8>() {
                config.intensity = Intensity::from_u8(level);
            }
        }

        if let Some(seed_str) = matches.get_one::<String>("seed") {
            if let Ok(seed) = seed_str.parse::<u64>() {
                config.seed = Some(seed);
            }
        }

        if let Some(salt) = matches.get_one::<String>("salt") {
            config.user_salt = salt.clone();
        }

        config.auto_verify = !matches.get_flag("no-verify");
        config.parallel = !matches.get_flag("no-parallel");

        config
    };

    // 读取输入文件
    let input_code = match fs::read_to_string(input_path) {
        Ok(code) => code,
        Err(e) => {
            eprintln!("Error reading input file: {}", e);
            std::process::exit(1);
        }
    };

    if verbose {
        println!("Input size: {} bytes", input_code.len());
        println!("Starting obfuscation...");
    }

    // 执行混淆
    let start = Instant::now();
    let mut orchestrator = Orchestrator::new(config);
    let result = orchestrator.obfuscate(&input_code);

    match result {
        Ok(output) => {
            let duration = start.elapsed();

            // 确定输出路径
            let output_path = matches
                .get_one::<String>("output")
                .cloned()
                .unwrap_or_else(|| {
                    let path = std::path::Path::new(input_path);
                    let stem = path
                        .file_stem()
                        .map(|s| s.to_string_lossy().to_string())
                        .unwrap_or_else(|| "output".to_string());
                    format!("{}_obfuscated.lua", stem)
                });

            // 写入输出文件
            match fs::write(&output_path, &output) {
                Ok(_) => {
                    println!("✓ Obfuscation completed successfully!");
                    println!("  Input:  {} bytes", input_code.len());
                    println!("  Output: {} bytes", output.len());
                    println!("  Time:   {:.2}ms", duration.as_secs_f64() * 1000.0);
                    println!("  Output: {:?}", output_path);
                }
                Err(e) => {
                    eprintln!("Error writing output file: {}", e);
                    std::process::exit(1);
                }
            }

            // 显示统计报告
            if show_stats || verbose {
                println!();
                println!("{}", orchestrator.stats().generate_report());
            }
        }
        Err(e) => {
            eprintln!("✗ Obfuscation failed: {}", e);
            std::process::exit(1);
        }
    }
}
