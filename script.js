document.addEventListener('DOMContentLoaded', () => {
    const participantsListDiv = document.getElementById('participants-list');
    const addParticipantBtn = document.getElementById('add-participant-btn');
    const expenseForm = document.getElementById('expense-form');
    const payerSelect = document.getElementById('payer');
    const participantsCheckboxesDiv = document.getElementById('participants-checkboxes');
    const equalSplitToggle = document.getElementById('equal-split');
    const individualAmountsSection = document.getElementById('individual-amounts-section');
    const individualAmountsDiv = document.getElementById('individual-amounts');
    const saveExpenseBtn = document.getElementById('save-expense-btn');
    const expensesListUl = document.getElementById('expenses-list');
    const summaryListUl = document.getElementById('summary-list');
    const transactionListUl = document.getElementById('transaction-list');

    let participants = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace']; // Danh sách người tham gia ban đầu
    let expenses = [];

    // Hiển thị danh sách người tham gia
    function renderParticipants() {
        participantsListDiv.innerHTML = '';
        payerSelect.innerHTML = '<option value="" disabled selected>Chọn người trả</option>';
        participantsCheckboxesDiv.innerHTML = '';
        individualAmountsDiv.innerHTML = '';

        participants.forEach((participant, index) => {
            // Hiển thị tên người tham gia
            const participantItem = document.createElement('div');
            participantItem.classList.add('participant-item');
            participantItem.textContent = participant;

            // Nút xóa người tham gia
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-times"></i>';
            deleteButton.addEventListener('click', () => deleteParticipant(index));
            participantItem.appendChild(deleteButton);

            participantsListDiv.appendChild(participantItem);

            // Thêm vào dropdown người trả
            const payerOption = document.createElement('option');
            payerOption.value = participant;
            payerOption.textContent = participant;
            payerSelect.appendChild(payerOption);

            // Thêm vào checkbox người tham gia chi tiêu
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `participant-${index}`;
            checkbox.value = participant;
            const label = document.createElement('label');
            label.setAttribute('for', `participant-${index}`);
            label.textContent = participant;
            participantsCheckboxesDiv.appendChild(checkbox);
            participantsCheckboxesDiv.appendChild(label);
            participantsCheckboxesDiv.appendChild(document.createElement('br'));

            // Thêm input cho số tiền cá nhân (ẩn ban đầu)
            const amountInput = document.createElement('input');
            amountInput.type = 'number';
            amountInput.id = `individual-amount-${participant}`;
            amountInput.classList.add('individual-amount-input');
            amountInput.placeholder = `Số tiền của ${participant}`;
            amountInput.style.display = 'none';
            individualAmountsDiv.appendChild(amountInput);
            individualAmountsDiv.appendChild(document.createElement('br'));
        });
    }

    // Thêm người tham gia mới
    addParticipantBtn.addEventListener('click', () => {
        const newParticipant = prompt('Nhập tên người tham gia mới:');
        if (newParticipant && !participants.includes(newParticipant)) {
            participants.push(newParticipant);
            renderParticipants();
        } else if (participants.includes(newParticipant)) {
            alert('Người này đã có trong danh sách.');
        }
    });

    // Xóa người tham gia
    function deleteParticipant(index) {
        const participantToDelete = participants[index];
        if (confirm(`Bạn có chắc chắn muốn xóa ${participantToDelete} không?`)) {
            participants.splice(index, 1);
            renderParticipants();
            recalculateBalances(); // Tính toán lại sau khi xóa
        }
    }

    // Xử lý khi toggle chia đều thay đổi
    equalSplitToggle.addEventListener('change', () => {
        const isChecked = equalSplitToggle.checked;
        individualAmountsSection.style.display = isChecked ? 'none' : 'block';
        // Hiển thị hoặc ẩn input số tiền tương ứng cho từng người tham gia
        const checkedParticipants = Array.from(participantsCheckboxesDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        individualAmountsDiv.querySelectorAll('.individual-amount-input').forEach(input => {
            const participantName = input.id.split('-').pop();
            input.style.display = isChecked || !checkedParticipants.includes(participantName) ? 'none' : 'block';
            const correspondingLabel = Array.from(individualAmountsDiv.querySelectorAll('label')).find(label => label.textContent.includes(participantName));
            if (correspondingLabel) {
                correspondingLabel.style.display = isChecked || !checkedParticipants.includes(participantName) ? 'none' : 'block';
            }
        });
    });

    // Xử lý khi người tham gia chi tiêu được chọn/bỏ chọn
    participantsCheckboxesDiv.addEventListener('change', () => {
        if (!equalSplitToggle.checked) {
            const checkedParticipants = Array.from(participantsCheckboxesDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            individualAmountsDiv.querySelectorAll('.individual-amount-input').forEach(input => {
                const participantName = input.id.split('-').pop();
                input.style.display = checkedParticipants.includes(participantName) ? 'block' : 'none';
                const correspondingLabel = Array.from(individualAmountsDiv.querySelectorAll('label')).find(label => label.textContent.includes(participantName));
                if (correspondingLabel) {
                    correspondingLabel.style.display = checkedParticipants.includes(participantName) ? 'block' : 'none';
                }
            });
        }
    });

    // Lưu chi tiêu mới
    saveExpenseBtn.addEventListener('click', () => {
        const expenseName = document.getElementById('expense-name').value.trim();
        const expenseAmount = parseFloat(document.getElementById('expense-amount').value);
        const payer = document.getElementById('payer').value;
        const selectedParticipants = Array.from(participantsCheckboxesDiv.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        const isSplitEqually = equalSplitToggle.checked;
        let individualAmounts = {};

        if (!expenseName) {
            alert('Vui lòng nhập tên chi tiêu.');
            return;
        }
        if (isNaN(expenseAmount) || expenseAmount <= 0) {
            alert('Vui lòng nhập số tiền hợp lệ.');
            return;
        }
        if (!payer) {
            alert('Vui lòng chọn người trả.');
            return;
        }
        if (selectedParticipants.length === 0) {
            alert('Vui lòng chọn người tham gia chi tiêu.');
            return;
        }

        if (!isSplitEqually) {
            let totalIndividualAmount = 0;
            let allAmountsEntered = true;
            selectedParticipants.forEach(participant => {
                const amountInput = document.getElementById(`individual-amount-${participant}`);
                const amount = parseFloat(amountInput.value);
                if (isNaN(amount)) {
                    allAmountsEntered = false;
                }
                individualAmounts[participant] = isNaN(amount) ? 0 : amount;
                totalIndividualAmount += individualAmounts[participant];
            });

            if (!allAmountsEntered || Math.abs(totalIndividualAmount - expenseAmount) > 0.01) {
                alert('Tổng số tiền của từng người tham gia phải bằng với số tiền chi tiêu.');
                return;
            }
        }

        const newExpense = {
            id: Date.now(), // Tạo ID duy nhất cho chi tiêu
            name: expenseName,
            amount: expenseAmount,
            payer: payer,
            participants: selectedParticipants,
            isSplitEqually: isSplitEqually,
            individualAmounts: isSplitEqually ? {} : individualAmounts
        };

        expenses.push(newExpense);
        renderExpenses();
        recalculateBalances();
        expenseForm.reset();
        equalSplitToggle.checked = true;
        individualAmountsSection.style.display = 'none';
        individualAmountsDiv.querySelectorAll('.individual-amount-input').forEach(input => input.style.display = 'none');
        individualAmountsDiv.querySelectorAll('label').forEach(label => label.style.display = 'none');
    });

    // Hiển thị danh sách chi tiêu
    function renderExpenses() {
        expensesListUl.innerHTML = '';
        expenses.forEach((expense, index) => {
            const listItem = document.createElement('li');
            const participantsText = expense.participants.join(', ');
            listItem.innerHTML = `
                <span>${expense.name} - ${expense.amount.toFixed(2)} VNĐ (Người trả: ${expense.payer}, Tham gia: ${participantsText})</span>
                <div>
                    <button class="edit-expense-btn" data-id="${expense.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-expense-btn" data-id="${expense.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            expensesListUl.appendChild(listItem);
        });

        // Thêm sự kiện cho nút xóa
        document.querySelectorAll('.delete-expense-btn').forEach(button => {
            button.addEventListener('click', function() {
                const expenseIdToDelete = parseInt(this.dataset.id);
                deleteExpense(expenseIdToDelete);
            });
        });

        // Thêm sự kiện cho nút sửa (tùy chọn nâng cao)
        document.querySelectorAll('.edit-expense-btn').forEach(button => {
            button.addEventListener('click', function() {
                const expenseIdToEdit = parseInt(this.dataset.id);
                editExpense(expenseIdToEdit);
            });
        });
    }

    // Xóa chi tiêu
    function deleteExpense(id) {
        if (confirm('Bạn có chắc chắn muốn xóa chi tiêu này không?')) {
            expenses = expenses.filter(expense => expense.id !== id);
            renderExpenses();
            recalculateBalances();
        }
    }

    // Sửa chi tiêu (tùy chọn nâng cao)
    function editExpense(id) {
        const expenseToEdit = expenses.find(expense => expense.id === id);
        if (expenseToEdit) {
            // TODO: Implement logic to populate the form with expenseToEdit data for editing
            alert('Tính năng sửa chi tiêu đang được phát triển.');
        }
    }

    // Tính toán số tiền mỗi người cần trả/nhận
    function calculateBalances() {
        const balances = {};
        participants.forEach(p => balances[p] = 0);

        expenses.forEach(expense => {
            const payer = expense.payer;
            const amount = expense.amount;
            const participantsInvolved = expense.participants;

            balances[payer] = (balances[payer] || 0) + amount; // Người trả đã chi tiền

            if (expense.isSplitEqually) {
                const share = amount / participantsInvolved.length;
                participantsInvolved.forEach(participant => {
                    balances[participant] = (balances[participant] || 0) - share;
                });
            } else {
                for (const participant in expense.individualAmounts) {
                    balances[participant] = (balances[participant] || 0) - expense.individualAmounts[participant];
                }
            }
        });

        return balances;
    }

    // Hiển thị tổng kết cá nhân
    function renderBalances(balances) {
        summaryListUl.innerHTML = '';
        participants.forEach(participant => {
            const balance = balances[participant] || 0;
            const listItem = document.createElement('li');
            listItem.textContent = `${participant}: ${balance.toFixed(2)} VNĐ`;
            summaryListUl.appendChild(listItem);
        });
    }

    // Tính toán các giao dịch cần thực hiện
    function calculateTransactions(balances) {
        const positiveBalances = [];
        const negativeBalances = [];

        for (const person in balances) {
            if (balances[person] > 0) {
                positiveBalances.push({ name: person, amount: balances[person] });
            } else if (balances[person] < 0) {
                negativeBalances.push({ name: person, amount: Math.abs(balances[person]) });
            }
        }

        transactionListUl.innerHTML = '';
        let i = 0;
        let j = 0;

        while (i < positiveBalances.length && j < negativeBalances.length) {
            const lender = positiveBalances[i];
            const borrower = negativeBalances[j];
            const transactionAmount = Math.min(lender.amount, borrower.amount);

            const listItem = document.createElement('li');
            listItem.textContent = `${borrower.name} trả cho ${lender.name}: ${transactionAmount.toFixed(2)} VNĐ`;
            transactionListUl.appendChild(listItem);

            lender.amount -= transactionAmount;
            borrower.amount -= transactionAmount;

            if (lender.amount === 0) {
                i++;
            }
            if (borrower.amount === 0) {
                j++;
            }
        }

        if (transactionListUl.children.length === 0) {
            const listItem = document.createElement('li');
            listItem.textContent = 'Mọi người đã thanh toán sòng phẳng!';
            transactionListUl.appendChild(listItem);
        }
    }

    // Hàm tính toán lại toàn bộ sau khi có thay đổi
    function recalculateBalances() {
        const balances = calculateBalances();
        renderBalances(balances);
        calculateTransactions(balances);
    }

    // Khởi tạo
    renderParticipants();
    recalculateBalances();
});