document.addEventListener('DOMContentLoaded', () => {
    const schedulesDiv = document.getElementById('schedules');
    const newCategoryInput = document.getElementById('new-category');
    const addCategoryButton = document.getElementById('add-category');
  
    function loadSchedules() {
      schedulesDiv.innerHTML = '';
  
      chrome.storage.local.get({ schedules: [], categories: ['work-related', 'leisure'] }, (result) => {
        const schedules = result.schedules;
        const categories = result.categories;
  
        categories.forEach(category => {
          const categoryDiv = document.createElement('div');
          categoryDiv.className = 'category';
          categoryDiv.innerHTML = `<h3>${category}:</h3>`;
  
          schedules.filter(schedule => schedule.category === category).forEach((schedule, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'schedule-item';
            itemDiv.innerHTML = `
              <p><a href="${schedule.url}" target="_blank" style="color: #000;">${schedule.title}</a></p>
              <label for="category-${index}">Category:</label>
              <select id="category-${index}">
                ${categories.map(cat => `<option value="${cat}" ${schedule.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
              </select>
              <label for="time-${index}">Time:</label>
              <input type="datetime-local" id="time-${index}" value="${schedule.time}">
              <button data-index="${index}" class="update-btn">Update</button>
              <button data-index="${index}" class="remove-btn">Remove</button>
            `;
  
            itemDiv.querySelector('.remove-btn').addEventListener('click', (event) => {
              const index = event.target.getAttribute('data-index');
              schedules.splice(index, 1);
              chrome.storage.local.set({ schedules }, () => {
                itemDiv.remove();
                loadSchedules(); // Reload schedules to update view
              });
            });
  
            itemDiv.querySelector('.update-btn').addEventListener('click', (event) => {
              const index = event.target.getAttribute('data-index');
              const category = document.getElementById(`category-${index}`).value;
              const time = document.getElementById(`time-${index}`).value;
              schedules[index].category = category;
              schedules[index].time = time;
              chrome.storage.local.set({ schedules }, () => {
                chrome.runtime.sendMessage({ action: 'updateSchedule', index: index, schedule: schedules[index] });
                loadSchedules(); // Reload schedules to update view
              });
            });
  
            categoryDiv.appendChild(itemDiv);
          });
  
          schedulesDiv.appendChild(categoryDiv);
        });
      });
    }
  
    addCategoryButton.addEventListener('click', () => {
      const newCategory = newCategoryInput.value.trim();
      if (newCategory) {
        chrome.storage.local.get({ categories: ['work-related', 'leisure'] }, (result) => {
          const categories = result.categories;
          if (!categories.includes(newCategory)) {
            categories.push(newCategory);
            chrome.storage.local.set({ categories }, () => {
              newCategoryInput.value = '';
              loadSchedules();
            });
          }
        });
      }
    });
  
    loadSchedules();
  });
  