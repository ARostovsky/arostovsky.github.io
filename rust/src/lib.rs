// https://www.hellorust.com/demos/add/index.html
// cargo build --release --target=wasm32-unknown-unknown

#[no_mangle]
pub fn sum(array: [i32; 100000], size: i32) -> i32 {
    return array.iter().take(size as usize).sum();
}

#[no_mangle]
pub fn mul(array: [i32; 100000], size: i32) -> i32 {
    if size == 0 { return 0; };
    let mut result = array[0];
    for n in 1..(size as usize) {
        result *= array[n];
    }
    return result;
}