use ekonomi_ledger::{validate, JournalCheck};
use std::io::{self, Read};

fn main() {
    let mut raw = String::new();
    io::stdin().read_to_string(&mut raw).expect("stdin");
    let journal: JournalCheck = serde_json::from_str(&raw).expect("json journal");
    match validate(&journal) {
        Ok(()) => println!("ok"),
        Err(err) => {
            eprintln!("{err:?}");
            std::process::exit(1);
        }
    }
}
