// Variables globales pour stocker les données des composants
let components = {};

// Charger les données depuis le fichier JSON
fetch("components.json")
  .then(response => response.json())
  .then(data => {
    components = data;
    populateManualConfig(); // Remplit les options du configurateur manuel
  })
  .catch(error => console.error("Erreur lors du chargement des composants :", error));

// Remplir le configurateur manuel avec les composants disponibles
function populateManualConfig() {
  const cpuSelect = document.getElementById("cpu-manual");
  const gpuSelect = document.getElementById("gpu-manual");
  const ramSelect = document.getElementById("ram-manual");

  // Ajouter les options des CPU
  components.cpu.forEach(cpu => {
    const option = document.createElement("option");
    option.value = cpu.id;
    option.textContent = `${cpu.name} - ${cpu.price}€`;
    cpuSelect.appendChild(option);
  });

  // Ajouter les options des GPU
  components.gpu.forEach(gpu => {
    const option = document.createElement("option");
    option.value = gpu.id;
    option.textContent = `${gpu.name} - ${gpu.price}€`;
    gpuSelect.appendChild(option);
  });

  // Ajouter les options de RAM
  ramSelect.innerHTML = `
    <option value="16">16 Go - 80€</option>
    <option value="32">32 Go - 150€</option>
    <option value="64">64 Go - 300€</option>
  `;
}

// Configurateur automatique
document.getElementById("auto-config-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const budget = parseInt(document.getElementById("budget").value);
  const useCase = document.getElementById("use-case").value;

  let selectedConfig = {
    cpu: null,
    gpu: null,
    motherboard: null,
    ram: { name: "16 Go DDR4", price: 80 }, // Valeur par défaut pour la RAM
    storage: { name: "Samsung 970 EVO Plus 1TB", price: 99 }, // Valeur par défaut pour le stockage
    psu: null,
    case: null
  };
  let total = 0;

  // Sélection des CPU
  for (const cpu of components.cpu) {
    if (total + cpu.price <= budget) {
      selectedConfig.cpu = cpu;
      total += cpu.price;
      break;
    }
  }

  // Sélection des GPU
  for (const gpu of components.gpu) {
    if (total + gpu.price <= budget) {
      selectedConfig.gpu = gpu;
      total += gpu.price;
      break;
    }
  }

  // Sélection des cartes mères compatibles
  for (const motherboard of components.motherboard) {
    if (
      motherboard.socket === selectedConfig.cpu.socket &&
      total + motherboard.price <= budget
    ) {
      selectedConfig.motherboard = motherboard;
      total += motherboard.price;
      break;
    }
  }

  // Ajouter les composants restants (RAM, stockage, alimentation, boîtier)
  total += selectedConfig.ram.price + selectedConfig.storage.price;
  selectedConfig.psu = components.psu.find(psu => total + psu.price <= budget);
  if (selectedConfig.psu) total += selectedConfig.psu.price;

  selectedConfig.case = components.case.find(caseItem => total + caseItem.price <= budget);
  if (selectedConfig.case) total += selectedConfig.case.price;

  // Affichage des résultats
  displayConfig(selectedConfig, "auto-config-results");
});

// Configurateur manuel
document.getElementById("manual-config-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const cpuId = parseInt(document.getElementById("cpu-manual").value);
  const gpuId = parseInt(document.getElementById("gpu-manual").value);
  const ramValue = document.getElementById("ram-manual").value;

  const selectedConfig = {
    cpu: components.cpu.find(cpu => cpu.id === cpuId),
    gpu: components.gpu.find(gpu => gpu.id === gpuId),
    ram: { name: `${ramValue} Go RAM`, price: ramValue === "16" ? 80 : ramValue === "32" ? 150 : 300 },
    storage: components.storage[0], // Par défaut : premier stockage
    psu: null,
    case: null
  };

  // Calcul du bottleneck (simple)
  const bottleneck = calculateBottleneck(selectedConfig.cpu.performance, selectedConfig.gpu.performance);

  // Affichage du résultat
  displayConfig(selectedConfig, "manual-config-results", bottleneck);
});

// Fonction pour calculer le bottleneck (différence de performances)
function calculateBottleneck(cpuPerf, gpuPerf) {
  const difference = Math.abs(cpuPerf - gpuPerf);
  if (difference > 10) {
    return "Attention : votre CPU ou GPU pourrait limiter les performances !";
  }
  return "Votre configuration est bien équilibrée.";
}

// Fonction pour afficher la configuration
function displayConfig(config, containerId, bottleneckMessage = null) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const components = [
    config.cpu,
    config.gpu,
    config.motherboard,
    config.ram,
    config.storage,
    config.psu,
    config.case
  ];

  components.forEach(component => {
    if (component) {
      const card = document.createElement("div");
      card.className = "component-card";
      card.innerHTML = `
        <img src="${component.img}" alt="${component.name}">
        <h4>${component.name}</h4>
        <p>${component.description || "Description non disponible"}</p>
        <p>Prix : ${component.price}€</p>
      `;
      container.appendChild(card);
    }
  });

  // Ajouter le message de bottleneck s'il existe
  if (bottleneckMessage) {
    const message = document.createElement("p");
    message.style.color = bottleneckMessage.includes("Attention") ? "red" : "green";
    message.textContent = bottleneckMessage;
    container.appendChild(message);
  }
}
