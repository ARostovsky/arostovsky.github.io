// https://www.hellorust.com/demos/add/index.html
// rustc --target=wasm32-unknown-unknown -O --crate-type=cdylib src\lib.rs

#[no_mangle]
pub fn fun() -> i32 {
    return 1234;
}