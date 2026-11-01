
// =============================================
// CORE LEDGER SIMULATOR
// COMPLETE JAVASCRIPT
// =============================================

// 1. DEFAULT ACCOUNTS
let accounts = [
    { name: "Cash", type: "Asset", openingBalance: 0, balance: 0 },
    { name: "Bank", type: "Asset", openingBalance: 0, balance: 0 },
    { name: "Capital", type: "Capital / Equity", openingBalance: 0, balance: 0 },
    { name: "Sales", type: "Income", openingBalance: 0, balance: 0 },
    { name: "Expenses", type: "Expense", openingBalance: 0, balance: 0 }
];

let transactions = [];
let nextTransactionId = 1;

// 2. LOCAL STORAGE KEYS
const STORAGE_KEYS = {
    accounts: "coreLedger_accounts",
    transactions: "coreLedger_transactions",
    nextId: "coreLedger_nextTransactionId"
};

// 3. SAVE DATA
function saveLedgerData() {
    try {
        localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
        localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
        localStorage.setItem(STORAGE_KEYS.nextId, String(nextTransactionId));
    } catch (error) {
        console.error("Storage error:", error);
        alert("Unable to save data in browser storage.");
    }
}

// 4. LOAD DATA
function loadLedgerData() {
    try {
        const savedAccounts = localStorage.getItem(STORAGE_KEYS.accounts);
        const savedTransactions = localStorage.getItem(STORAGE_KEYS.transactions);
        const savedNextId = localStorage.getItem(STORAGE_KEYS.nextId);

        if (savedAccounts) {
            const parsedAccounts = JSON.parse(savedAccounts);

            if (Array.isArray(parsedAccounts)) {
                accounts = parsedAccounts.map(account => {
                    const openingBalance = Number(
                        account.openingBalance ?? account.balance ?? 0
                    );

                    return {
                        name: String(account.name),
                        type: String(account.type),
                        openingBalance: Number.isFinite(openingBalance) ? openingBalance : 0,
                        balance: openingBalance
                    };
                });
            }
        }

        if (savedTransactions) {
            const parsedTransactions = JSON.parse(savedTransactions);

            if (Array.isArray(parsedTransactions)) {
                transactions = parsedTransactions
                    .filter(t =>
                        t &&
                        t.name &&
                        t.date &&
                        t.debitAccount &&
                        t.creditAccount &&
                        Number.isFinite(Number(t.amount)) &&
                        Number(t.amount) > 0
                    )
                    .map(t => ({
                        id: Number(t.id),
                        name: String(t.name),
                        date: String(t.date),
                        debitAccount: String(t.debitAccount),
                        creditAccount: String(t.creditAccount),
                        amount: Number(t.amount)
                    }));
            }
        }

        const largestId = transactions.reduce(
            (max, t) => Math.max(max, Number(t.id) || 0),
            0
        );

        const storedNextId = Number(savedNextId);

        nextTransactionId =
            Number.isFinite(storedNextId) && storedNextId > largestId
                ? storedNextId
                : largestId + 1;

        recalculateAccountBalances();

    } catch (error) {
        console.error("Loading error:", error);
        alert("Saved data could not be loaded.");
    }
}

// 5. CHECK ACCOUNT NORMAL BALANCE
function isDebitNormal(account) {
    return account.type === "Asset" || account.type === "Expense";
}

// 6. RECALCULATE ACCOUNT BALANCES
function recalculateAccountBalances() {
    accounts.forEach(account => {
        account.balance = Number(account.openingBalance) || 0;
    });

    transactions.forEach(transaction => {
        applyTransactionEffect(transaction, 1);
    });
}

// 7. APPLY TRANSACTION EFFECT
function applyTransactionEffect(transaction, direction) {
    const debitAccount = accounts.find(
        account => account.name === transaction.debitAccount
    );

    const creditAccount = accounts.find(
        account => account.name === transaction.creditAccount
    );

    if (!debitAccount || !creditAccount) {
        return;
    }

    const amount = Number(transaction.amount);

    debitAccount.balance += (
        isDebitNormal(debitAccount) ? amount : -amount
    ) * direction;

    creditAccount.balance += (
        isDebitNormal(creditAccount) ? -amount : amount
    ) * direction;
}

// 8. DISPLAY ACCOUNTS
function displayAccounts() {
    const table = document.getElementById("accountTableBody");
    if (!table) return;

    table.innerHTML = "";

    accounts.forEach(account => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = account.name;

        const typeCell = document.createElement("td");
        typeCell.textContent = account.type;

        const balanceCell = document.createElement("td");
        balanceCell.textContent = "₹ " + account.balance.toFixed(2);

        row.append(nameCell, typeCell, balanceCell);
        table.appendChild(row);
    });
}

// 9. UPDATE ACCOUNT DROPDOWNS
function updateAccountDropdowns() {
    const dropdowns = [
        ["debitAccount", "Select Debit Account"],
        ["creditAccount", "Select Credit Account"],
        ["filterDebitAccount", "All Debit Accounts"],
        ["filterCreditAccount", "All Credit Accounts"]
    ];

    dropdowns.forEach(([id, placeholder]) => {
        const select = document.getElementById(id);
        if (!select) return;

        const oldValue = select.value;

        select.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = placeholder;
        select.appendChild(defaultOption);

        accounts.forEach(account => {
            const option = document.createElement("option");
            option.value = account.name;
            option.textContent = account.name;
            select.appendChild(option);
        });

        if (accounts.some(account => account.name === oldValue)) {
            select.value = oldValue;
        }
    });
}

// 10. ADD ACCOUNT
function addAccount() {
    const nameInput = document.getElementById("accountName");
    const typeInput = document.getElementById("accountType");
    const balanceInput = document.getElementById("openingBalance");

    const name = nameInput.value.trim();
    const type = typeInput.value;
    const openingBalance = Number(balanceInput.value);

    if (!name || !type || balanceInput.value === "") {
        alert("Please fill all account details!");
        return;
    }

    if (!Number.isFinite(openingBalance) || openingBalance < 0) {
        alert("Please enter a valid opening balance!");
        return;
    }

    const exists = accounts.some(
        account => account.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
        alert("Account already exists!");
        return;
    }

    accounts.push({
        name,
        type,
        openingBalance,
        balance: openingBalance
    });

    saveLedgerData();
    refreshLedgerViews();
    updateAccountDropdowns();

    nameInput.value = "";
    typeInput.value = "";
    balanceInput.value = "";

    alert("Account added successfully!");
}

// 11. ADD TRANSACTION
function setupTransactionForm() {
    const form = document.getElementById("transactionForm");
    if (!form) return;

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("transactionName").value.trim();
        const date = document.getElementById("transactionDate").value;
        const debitAccount = document.getElementById("debitAccount").value;
        const creditAccount = document.getElementById("creditAccount").value;

        const amountInput = document.getElementById("transactionAmount");
        const amount = Number(amountInput.value);

        if (!name || !date || !debitAccount || !creditAccount ||
            amountInput.value === "") {
            alert("Please fill all transaction details!");
            return;
        }

        if (debitAccount === creditAccount) {
            alert("Debit and Credit accounts cannot be the same!");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            alert("Please enter a valid amount!");
            return;
        }

        const debitExists = accounts.some(a => a.name === debitAccount);
        const creditExists = accounts.some(a => a.name === creditAccount);

        if (!debitExists || !creditExists) {
            alert("Selected account does not exist!");
            return;
        }

        const transaction = {
            id: nextTransactionId++,
            name,
            date,
            debitAccount,
            creditAccount,
            amount
        };

        transactions.push(transaction);

        recalculateAccountBalances();
        saveLedgerData();
        refreshLedgerViews();

        form.reset();

        alert("Transaction added successfully!");
    });
}

// 12. DISPLAY TRANSACTIONS WITH EDIT AND DELETE
function displayTransactions() {
    const table = document.getElementById("transactionTableBody");
    if (!table) return;

    table.innerHTML = "";

    const searchValue =
        document.getElementById("searchTransaction")?.value.trim().toLowerCase() || "";

    const filterDate =
        document.getElementById("filterDate")?.value || "";

    const filterDebit =
        document.getElementById("filterDebitAccount")?.value || "";

    const filterCredit =
        document.getElementById("filterCreditAccount")?.value || "";

    const filteredTransactions = transactions.filter(transaction => {
        return transaction.name.toLowerCase().includes(searchValue) &&
            (!filterDate || transaction.date === filterDate) &&
            (!filterDebit || transaction.debitAccount === filterDebit) &&
            (!filterCredit || transaction.creditAccount === filterCredit);
    });

    if (filteredTransactions.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No matching transactions found.
                </td>
            </tr>
        `;
        return;
    }

    filteredTransactions.slice().reverse().forEach(transaction => {
        const row = document.createElement("tr");

        const values = [
            transaction.date,
            transaction.name,
            transaction.debitAccount,
            transaction.creditAccount,
            "₹ " + transaction.amount.toFixed(2),
            "Completed"
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        // ACTIONS COLUMN
        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "action-buttons";

        // EDIT BUTTON
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-btn edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editTransaction(transaction.id);
        });

        // DELETE BUTTON
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-btn delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            deleteTransaction(transaction.id);
        });

        actions.append(editButton, deleteButton);
        actionsCell.appendChild(actions);
        row.appendChild(actionsCell);

        table.appendChild(row);
    });
}

// 13. EDIT TRANSACTION
function editTransaction(transactionId) {
    const transaction = transactions.find(
        t => Number(t.id) === Number(transactionId)
    );

    if (!transaction) {
        alert("Transaction not found!");
        return;
    }

    const accountNames = accounts.map(a => a.name);
    const accountMessage = "Available accounts: " + accountNames.join(", ");

    const newName = prompt("Enter transaction name:", transaction.name);
    if (newName === null) return;

    const newDate = prompt(
        "Enter date (YYYY-MM-DD):",
        transaction.date
    );
    if (newDate === null) return;

    const newDebit = prompt(
        "Enter debit account name.\n" + accountMessage,
        transaction.debitAccount
    );
    if (newDebit === null) return;

    const newCredit = prompt(
        "Enter credit account name.\n" + accountMessage,
        transaction.creditAccount
    );
    if (newCredit === null) return;

    const newAmountText = prompt(
        "Enter transaction amount:",
        String(transaction.amount)
    );
    if (newAmountText === null) return;

    const name = newName.trim();
    const amount = Number(newAmountText);

    // VALIDATION
    if (!name) {
        alert("Transaction name cannot be empty!");
        return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate) ||
        Number.isNaN(Date.parse(newDate))) {
        alert("Enter a valid date in YYYY-MM-DD format!");
        return;
    }

    if (newDebit === newCredit) {
        alert("Debit and Credit accounts cannot be the same!");
        return;
    }

    if (!accountNames.includes(newDebit) ||
        !accountNames.includes(newCredit)) {
        alert("Please enter an exact account name from the available accounts!");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than zero!");
        return;
    }

    // UPDATE TRANSACTION
    transaction.name = name;
    transaction.date = newDate;
    transaction.debitAccount = newDebit;
    transaction.creditAccount = newCredit;
    transaction.amount = amount;

    recalculateAccountBalances();
    saveLedgerData();
    refreshLedgerViews();

    alert("Transaction updated successfully!");
}

// 14. DELETE TRANSACTION
function deleteTransaction(transactionId) {
    const index = transactions.findIndex(
        t => Number(t.id) === Number(transactionId)
    );

    if (index === -1) {
        alert("Transaction not found!");
        return;
    }

    const confirmed = confirm(
        'Are you sure you want to delete "' +
        transactions[index].name + '"?'
    );

    if (!confirmed) return;

    transactions.splice(index, 1);

    recalculateAccountBalances();
    saveLedgerData();
    refreshLedgerViews();

    alert("Transaction deleted successfully!");
}

// 15. SEARCH AND FILTERS
function setupTransactionFilters() {
    const search = document.getElementById("searchTransaction");
    const date = document.getElementById("filterDate");
    const debit = document.getElementById("filterDebitAccount");
    const credit = document.getElementById("filterCreditAccount");
    const reset = document.getElementById("resetTransactionFilters");

    if (search) search.addEventListener("input", displayTransactions);
    if (date) date.addEventListener("change", displayTransactions);
    if (debit) debit.addEventListener("change", displayTransactions);
    if (credit) credit.addEventListener("change", displayTransactions);

    if (reset) {
        reset.addEventListener("click", function() {
            if (search) search.value = "";
            if (date) date.value = "";
            if (debit) debit.value = "";
            if (credit) credit.value = "";

            displayTransactions();
        });
    }
}

// 16. UPDATE DASHBOARD
function updateDashboard() {
    let totalDebit = 0;
    let totalCredit = 0;

    transactions.forEach(transaction => {
        totalDebit += transaction.amount;
        totalCredit += transaction.amount;
    });

    document.getElementById("totalDebitDashboard").textContent =
        "₹ " + totalDebit.toFixed(2);

    document.getElementById("totalCreditDashboard").textContent =
        "₹ " + totalCredit.toFixed(2);

    document.getElementById("totalTransactionsDashboard").textContent =
        transactions.length;
}

// 17. UPDATE TRIAL BALANCE
function updateTrialBalance() {
    const table = document.getElementById("trialBalanceBody");
    if (!table) return;

    table.innerHTML = "";

    let totalDebit = 0;
    let totalCredit = 0;

    accounts.forEach(account => {
        let debit = 0;
        let credit = 0;

        if (isDebitNormal(account)) {
            if (account.balance >= 0) {
                debit = account.balance;
            } else {
                credit = Math.abs(account.balance);
            }
        } else {
            if (account.balance >= 0) {
                credit = account.balance;
            } else {
                debit = Math.abs(account.balance);
            }
        }

        totalDebit += debit;
        totalCredit += credit;

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        const debitCell = document.createElement("td");
        const creditCell = document.createElement("td");

        nameCell.textContent = account.name;
        debitCell.textContent = debit.toFixed(2);
        creditCell.textContent = credit.toFixed(2);

        row.append(nameCell, debitCell, creditCell);
        table.appendChild(row);
    });

    // ADD TOTAL ROW VALUES
    document.getElementById("totalDebit").textContent =
        "₹ " + totalDebit.toFixed(2);

    document.getElementById("totalCredit").textContent =
        "₹ " + totalCredit.toFixed(2);

    // RECONCILIATION
    const difference = Math.abs(totalDebit - totalCredit);

    document.getElementById("reconciliationDebit").textContent =
        "₹ " + totalDebit.toFixed(2);

    document.getElementById("reconciliationCredit").textContent =
        "₹ " + totalCredit.toFixed(2);

    document.getElementById("reconciliationDifference").textContent =
        "₹ " + difference.toFixed(2);

    const status = document.getElementById("reconciliationStatus");

    if (status) {
        if (difference < 0.005) {
            status.textContent =
                "✓ Balanced - Reconciliation Successful";
            status.style.background = "#dcfce7";
            status.style.color = "#166534";
        } else {
            status.textContent =
                "✗ Not Balanced - Difference Found";
            status.style.background = "#fee2e2";
            status.style.color = "#991b1b";
        }
    }
}

// 18. REFRESH ALL VIEWS
function refreshLedgerViews() {
    displayAccounts();
    displayTransactions();
    updateDashboard();
    updateTrialBalance();
}

// 19. INITIALIZE PROJECT
function initializeLedger() {
    loadLedgerData();

    displayAccounts();
    updateAccountDropdowns();

    setupTransactionForm();
    setupTransactionFilters();

    displayTransactions();
    updateDashboard();
    updateTrialBalance();
}

// 20. START APPLICATION
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeLedger);
} else {
    initializeLedger();
}
