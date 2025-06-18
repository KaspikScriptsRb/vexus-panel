document.addEventListener('DOMContentLoaded', () => {
    // This will be automatically set by the hosting environment.
    // It dynamically finds the address of our API.
    const API_BASE_URL = '.';

    // Modal elements
    const createKeyModal = document.getElementById('createKeyModal');
    const createKeyBtn = document.getElementById('createKeyBtn');
    const closeModalBtn = document.querySelector('.close-btn');
    const confirmCreateKeyBtn = document.getElementById('confirmCreateKeyBtn');

    // Form inputs
    const keyNameInput = document.getElementById('keyName');
    const keyDurationInput = document.getElementById('keyDuration');
    const keyDurationUnitInput = document.getElementById('keyDurationUnit');
    
    // Table and actions
    const keyListBody = document.getElementById('keyList');
    const searchInput = document.getElementById('searchInput');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const deleteUsedBtn = document.getElementById('deleteUsedBtn');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');

    // --- API Functions ---
    const api = {
        fetchKeys: async () => {
            const response = await fetch(`${API_BASE_URL}/keys`);
            if (!response.ok) throw new Error('Failed to fetch keys');
            return await response.json();
        },
        createKey: async (name, duration, unit) => {
            const value = `VEXUS-${generateRandomString(4)}-${generateRandomString(4)}-${generateRandomString(4)}`;
            const expiresAt = calculateExpiry(duration, unit);
            const response = await fetch(`${API_BASE_URL}/keys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, value, expiresAt })
            });
            if (!response.ok) throw new Error('Failed to create key');
            return await response.json();
        },
        updateKey: async (id, updates) => {
            const response = await fetch(`${API_BASE_URL}/keys/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Failed to update key');
            return await response.json();
        },
        deleteKey: async (id) => {
            const response = await fetch(`${API_BASE_URL}/keys/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete key');
            return { success: true };
        }
    };

    // --- Utility Functions ---
    function calculateExpiry(duration, unit) {
        if (unit === 'unlimited') return null;
        const date = new Date();
        const d = parseInt(duration);
        if (unit === 'days') date.setDate(date.getDate() + d);
        else if (unit === 'months') date.setMonth(date.getMonth() + d);
        else if (unit === 'years') date.setFullYear(date.getFullYear() + d);
        return date.toISOString().split('T')[0];
    }

    function generateRandomString(length) {
        return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
    }

    // --- UI Rendering ---
    function renderKeys(keys) {
        keyListBody.innerHTML = '';
        if (!keys || keys.length === 0) {
            const row = keyListBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.textContent = 'Ключи не найдены.';
            cell.style.textAlign = 'center';
            return;
        }

        keys.forEach(key => {
            const row = keyListBody.insertRow();
            row.dataset.id = key.id;

            // Checkbox
            row.insertCell().innerHTML = `<input type="checkbox" class="key-checkbox" data-id="${key.id}">`;

            // Key Value
            row.insertCell().textContent = key.value;

            // Note/Name
            row.insertCell().textContent = key.name;

            // Status
            const statusCell = row.insertCell();
            let statusText, statusClass;
            if (key.isBanned) {
                statusText = 'Забанен';
                statusClass = 'status-banned';
            } else if (key.hwid) {
                statusText = 'Использован';
                statusClass = 'status-used';
            } else {
                statusText = 'Не использован';
                statusClass = 'status-not-used';
            }
            statusCell.innerHTML = `<span class="status ${statusClass}">${statusText}</span>`;
            
            // HWID
            row.insertCell().textContent = key.hwid || 'N/A';

            // Expires
            row.insertCell().textContent = key.expiresAt || 'Никогда';

            // Actions
            const actionsCell = row.insertCell();
            actionsCell.classList.add('actions-cell');
            actionsCell.innerHTML = `
                <button class="actions-btn" data-id="${key.id}">Действия</button>
                <div class="dropdown-content" id="dropdown-${key.id}">
                    <a href="#" class="edit-action" data-id="${key.id}">Изменить</a>
                    <a href="#" class="reset-hwid-action" data-id="${key.id}" ${!key.hwid ? 'style="display:none;"' : ''}>Сброс HWID</a>
                    <a href="#" class="ban-action" data-id="${key.id}">${key.isBanned ? 'Разбанить' : 'Забанить'}</a>
                    <a href="#" class="delete-action delete" data-id="${key.id}">Удалить</a>
                </div>
            `;
        });
    }

    async function refreshTable() {
        const searchTerm = searchInput.value.toLowerCase();
        let keys = await api.fetchKeys();
        
        if (searchTerm) {
            keys = keys.filter(key => 
                key.name.toLowerCase().includes(searchTerm) ||
                key.value.toLowerCase().includes(searchTerm) ||
                (key.hwid && key.hwid.toLowerCase().includes(searchTerm))
            );
        }
        
        renderKeys(keys);
    }

    // --- Event Handlers ---
    
    // Modal
    createKeyBtn.onclick = () => createKeyModal.style.display = 'block';
    closeModalBtn.onclick = () => createKeyModal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == createKeyModal) {
            createKeyModal.style.display = 'none';
        }
    };
    
    // Key Creation
    confirmCreateKeyBtn.onclick = async () => {
        const name = keyNameInput.value.trim();
        const duration = keyDurationInput.value;
        const unit = keyDurationUnitInput.value;
        if (!name) return alert('Требуется имя/описание.');
        
        await api.createKey(name, duration, unit);
        createKeyModal.style.display = 'none';
        keyNameInput.value = '';
        await refreshTable();
    };

    // Search
    searchInput.addEventListener('input', refreshTable);

    // Dropdown and Actions
    keyListBody.addEventListener('click', async (event) => {
        const target = event.target;
        
        // Toggle Dropdown
        if (target.classList.contains('actions-btn')) {
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-content.show').forEach(d => {
                if (d.id !== `dropdown-${target.dataset.id}`) {
                    d.classList.remove('show');
                }
            });
            const id = target.dataset.id;
            document.getElementById(`dropdown-${id}`).classList.toggle('show');
            return; // Stop further processing
        }

        const id = target.dataset.id;
        if (!id) return;

        try {
            if (target.classList.contains('delete-action')) {
                if (confirm(`Уверены, что хотите удалить ключ? Это действие необратимо.`)) {
                    await api.deleteKey(id);
                    await refreshTable();
                }
            }
            if (target.classList.contains('edit-action')) {
                const key = (await api.fetchKeys()).find(k => k.id === id);
                const newName = prompt('Введите новое имя:', key.name);
                if (newName !== null && newName.trim() !== '') {
                    await api.updateKey(id, { name: newName });
                    await refreshTable();
                }
            }
            if (target.classList.contains('reset-hwid-action')) {
                if (confirm('Сбросить HWID для этого ключа?')) {
                    await api.updateKey(id, { hwid: null });
                    await refreshTable();
                }
            }
            if (target.classList.contains('ban-action')) {
                const key = (await api.fetchKeys()).find(k => k.id === id);
                await api.updateKey(id, { isBanned: !key.isBanned });
                await refreshTable();
            }
        } catch (error) {
            console.error(error);
            alert('Произошла ошибка: ' + error.message);
        }
    });

    // Hide dropdown if clicked outside
    window.addEventListener('click', (event) => {
        if (!event.target.matches('.actions-btn')) {
            document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
        }
    }, true);

    // Bulk Actions
    deleteAllBtn.onclick = async () => {
        const selectedIds = Array.from(document.querySelectorAll('.key-checkbox:checked')).map(cb => cb.dataset.id);
        if (selectedIds.length === 0) return alert('Выберите ключи для удаления.');
        
        if (confirm(`Вы уверены, что хотите удалить ${selectedIds.length} выбранных ключей?`)) {
            try {
                for (const id of selectedIds) await api.deleteKey(id);
                await refreshTable();
            } catch (error) {
                 console.error(error);
                 alert('Ошибка при удалении ключей.');
            }
        }
    };
    deleteUsedBtn.onclick = async () => {
         if (confirm('Вы уверены, что хотите удалить ВСЕ ИСПОЛЬЗОВАННЫЕ ключи?')) {
            try {
                const keys = await api.fetchKeys();
                const usedKeys = keys.filter(k => k.hwid).map(k => k.id);
                for (const id of usedKeys) await api.deleteKey(id);
                await refreshTable();
            } catch (error) {
                 console.error(error);
                 alert('Ошибка при удалении использованных ключей.');
            }
        }
    };

    selectAllCheckbox.addEventListener('change', (event) => {
        document.querySelectorAll('.key-checkbox').forEach(checkbox => {
            checkbox.checked = event.target.checked;
        });
    });
    
    // Initial Load
    refreshTable();
}); 