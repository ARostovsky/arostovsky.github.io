// rustc --target=wasm32-unknown-unknown src\main.rs

use std::env;

pub fn main() {
    println!("Hello, world!");
    let args: Vec<String> = env::args().collect();
    println!("{}", args.join(" "));
}