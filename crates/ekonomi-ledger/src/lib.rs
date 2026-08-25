//! Mirrors `src/lib/ekonomi/journal.ts`. A journal is accepted only when
//! every entry uses a known account and debit öre equals credit öre.

use serde::Deserialize;
use std::collections::HashSet;

#[derive(Debug, Deserialize)]
pub struct JournalCheck {
    pub entries: Vec<Entry>,
}

#[derive(Debug, Deserialize)]
pub struct Entry {
    pub account: String,
    pub debit_ore: i64,
    pub credit_ore: i64,
}

const ACCOUNTS: &[&str] = &[
    "1510", "1910", "1930", "1931", "1932", "2610", "2614", "2615", "3001", "3002", "3041", "3740",
];

#[derive(Debug, PartialEq, Eq)]
pub enum LedgerError {
    Empty,
    UnknownAccount(String),
    NegativeAmount,
    BothSides,
    Unbalanced { debit: i64, credit: i64 },
}

pub fn validate(journal: &JournalCheck) -> Result<(), LedgerError> {
    if journal.entries.is_empty() {
        return Err(LedgerError::Empty);
    }
    let known: HashSet<&str> = ACCOUNTS.iter().copied().collect();
    let mut debit = 0_i64;
    let mut credit = 0_i64;
    for entry in &journal.entries {
        if !known.contains(entry.account.as_str()) {
            return Err(LedgerError::UnknownAccount(entry.account.clone()));
        }
        if entry.debit_ore < 0 || entry.credit_ore < 0 {
            return Err(LedgerError::NegativeAmount);
        }
        if entry.debit_ore > 0 && entry.credit_ore > 0 {
            return Err(LedgerError::BothSides);
        }
        debit += entry.debit_ore;
        credit += entry.credit_ore;
    }
    if debit != credit || debit == 0 {
        return Err(LedgerError::Unbalanced { debit, credit });
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn issue_invoice_balances() {
        let journal = JournalCheck {
            entries: vec![
                Entry { account: "1510".into(), debit_ore: 12500, credit_ore: 0 },
                Entry { account: "3001".into(), debit_ore: 0, credit_ore: 10000 },
                Entry { account: "2610".into(), debit_ore: 0, credit_ore: 2500 },
            ],
        };
        assert_eq!(validate(&journal), Ok(()));
    }

    #[test]
    fn rejects_unbalanced() {
        let journal = JournalCheck {
            entries: vec![
                Entry { account: "1510".into(), debit_ore: 100, credit_ore: 0 },
                Entry { account: "3001".into(), debit_ore: 0, credit_ore: 90 },
            ],
        };
        assert!(validate(&journal).is_err());
    }
}
