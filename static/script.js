let categoryChart = null;
let monthlyChart = null;

async function loadDashboard() {
    await loadSummary();
    await loadCategoryChart();
    await loadMonthlyChart();
    await loadHighestExpenses();
    await loadAllExpenses();
}

async function loadSummary() {
    const response = await fetch("/api/summary");
    const data = await response.json();
    document.getElementById("total").textContent = "₹" + data.total.toFixed(2);
    document.getElementById("average").textContent = "₹" + data.average.toFixed(2);
    document.getElementById("highest").textContent = "₹" + data.highest.toFixed(2);
    document.getElementById("count").textContent = data.count;
}

async function loadCategoryChart() {
    const response = await fetch("/api/category");
    const data = await response.json();
    const labels = data.map(item => item.category);
    const values = data.map(item => item.amount);
    const canvas = document.getElementById("categoryChart");

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{ data: values }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom" }
            }
        }
    });
}

async function loadMonthlyChart() {
    const response = await fetch("/api/monthly");
    const data = await response.json();
    const labels = data.map(item => item.month);
    const values = data.map(item => item.amount);
    const canvas = document.getElementById("monthlyChart");

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Monthly Spending",
                data: values
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

async function loadHighestExpenses() {
    const response = await fetch("/api/highest");
    const data = await response.json();
    const table = document.getElementById("highestTable");
    table.innerHTML = "";

    if (data.length === 0) {
        table.innerHTML = `<tr><td colspan="4" class="empty-row">No expenses available.</td></tr>`;
        return;
    }

    data.forEach(expense => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.category}</td>
            <td>${expense.description}</td>
            <td>₹${expense.amount.toFixed(2)}</td>
        `;
        table.appendChild(row);
    });
}

async function loadAllExpenses() {
    const response = await fetch("/api/expenses");
    const data = await response.json();
    const table = document.getElementById("expenseTable");
    table.innerHTML = "";

    if (data.length === 0) {
        table.innerHTML = `<tr><td colspan="5" class="empty-row">No expenses available.</td></tr>`;
        return;
    }

    data.forEach((expense, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${expense.date}</td>
            <td>${expense.category}</td>
            <td>${expense.description}</td>
            <td>₹${expense.amount.toFixed(2)}</td>
            <td><button class="delete-btn" onclick="deleteExpense(${index})">Delete</button></td>
        `;
        table.appendChild(row);
    });
}

document.getElementById("expenseForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const expense = {
        date: document.getElementById("date").value,
        category: document.getElementById("category").value,
        description: document.getElementById("description").value.trim(),
        amount: parseFloat(document.getElementById("amount").value)
    };

    try {
        const response = await fetch("/api/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expense)
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Could not add expense.");
            return;
        }

        document.getElementById("expenseForm").reset();
        await loadDashboard();
    } catch (error) {
        alert("Could not connect to the server.");
    }
});

document.getElementById("uploadButton").addEventListener("click", async function() {
    const fileInput = document.getElementById("excelFile");
    const message = document.getElementById("uploadMessage");

    if (fileInput.files.length === 0) {
        message.textContent = "Please select an Excel file.";
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    message.textContent = "Importing...";

    try {
        const response = await fetch("/api/import-excel", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.detail || "Import failed.";
            return;
        }

        message.textContent = data.message + " Records imported: " + data.imported;
        fileInput.value = "";
        await loadDashboard();
    } catch (error) {
        message.textContent = "Could not connect to the server.";
    }
});

async function deleteExpense(index) {
    if (!confirm("Are you sure you want to delete this expense?")) {
        return;
    }

    try {
        const response = await fetch(`/api/delete/${index}`, {
            method: "DELETE"
        });

        if (response.ok) {
            await loadDashboard();
        } else {
            alert("Could not delete the expense.");
        }
    } catch (error) {
        alert("Could not connect to the server.");
    }
}

document.getElementById("clearButton").addEventListener("click", async function() {
    if (!confirm("Are you sure you want to clear ALL expenses?")) {
        return;
    }

    try {
        const response = await fetch("/api/clear", {
            method: "DELETE"
        });

        if (response.ok) {
            await loadDashboard();
        }
    } catch (error) {
        alert("Could not connect to the server.");
    }
});

loadDashboard();