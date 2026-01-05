// URL do seu Worker (já publicado)
const WORKER_URL = "https://spring-glade-d911.fismat.workers.dev";

const nomesDestacados = [
  "Gustavo Burdman", "Renata Zukanovich Funchal", "Oscar Eboli", "O. J. P. Eboli",
  "Gustavo F. S. Alves", "Matheus Martines", "Luighi P. S. Leal", "L.P. Santos Leal",
  "L. P. Santos Leal", "L. P. S. Leal", "Peter Reimitz", "Ana Luisa Foguel",
  "Gabriel M. Salla", "Oscar J. P. Éboli", "Lucas Magno D. Ramos",
  "Gustavo S.S. Sakoda", "G.S.S. Sakoda", "Disha Bhatia", "Sujay Shil",
  "Rafiqul Rahaman", "Barbara Amaral", "Eduardo Casali",
  "Frederique Grassi", "J.C.A. Barata", "João C. A. Barata", "Joao C. A. Barata",
  "L.R.W.Abramo", "L. Raul Abramo", "R. Abramo", "Raul Abramo", "Natália V.N. Rodrigues",
  "Marcos Lima", "Matthew Luzum", "Luis Raul Abramo", "João Vitor Dinarte Ferri",
  "Igor Neiva Mesquita", "Álvaro S. de Jesus", "Á.S. de Jesus", "Naim Elias Comar",
  "Alisson Tezzin", "Ian Tashiro", "Kevin Pala", "Pedro Ishida",
  "L. R. Abramo", "O. J. P. Éboli", "Bárbara Amaral",
  "R. Zukanovich Funchal", "Pedro Bittar", "Gabriel Santos Menezes", "Ricardo Correa da Silva",
  "R Correa da Silva", "RC da Silva", "Lua F. T. Airoldi", "Victor Hugo M. Ramos",
  "Victor Hugo Marques Ramos", "Henrique Ay Casa Grande", "Cleverson Andrade Goulart", "Mauricio Porto Pato"
];

const resultsDiv = document.getElementById("results");

function deveDestacarAutor(nomeAutor) {
  return nomesDestacados.some(autor => autor.toLowerCase() === nomeAutor.toLowerCase());
}

async function carregarResultados() {
  resultsDiv.innerHTML = "Carregando...";

  const autores = nomesDestacados.map(nome => `au:"${nome.replace(/ /g, "+")}"`).join("+OR+");
  const query = `search_query=${autores}&sortBy=submittedDate&sortOrder=descending&max_results=100`;

  try {
    // chama o Worker para contornar CORS e devolver o XML do arXiv
    const response = await fetch(`${WORKER_URL}?${query}`);
    if (!response.ok) throw new Error("Erro ao acessar Worker: " + response.status);

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");

    const entries = xml.querySelectorAll("entry");
    if (entries.length === 0) {
      resultsDiv.innerHTML = "Nenhum resultado encontrado.";
      return;
    }

    let html = "";
    const vistos = new Set();

    entries.forEach(entry => {
      const id = entry.querySelector("id")?.textContent;
      if (!id || vistos.has(id)) return;
      vistos.add(id);

      const title = entry.querySelector("title")?.textContent.trim() || "Sem título";
      const link = entry.querySelector("id")?.textContent || "#";
      const authors = Array.from(entry.querySelectorAll("author > name")).map(a => a.textContent.trim());
      const published = entry.querySelector("published")?.textContent.slice(0, 10) || "Sem data";

      if (!published.startsWith("2026")) return;

      const autoresDestacados = authors.filter(nome => deveDestacarAutor(nome));
      if (autoresDestacados.length === 0) return;

      const autoresNaoDestacados = authors.filter(nome => !deveDestacarAutor(nome));
      const autoresOrdenados = [...autoresDestacados, ...autoresNaoDestacados];

      let autoresExibidos = autoresOrdenados.slice(0, 8);
      if (autoresOrdenados.length > 8) autoresExibidos.push("et al.");

      const authorsHTML = autoresExibidos.map(nome =>
        deveDestacarAutor(nome) ? `<strong>${nome}</strong>` : nome
      ).join(", ");

      const journalRef = entry.querySelector("arxiv\\:journal_ref, journal_ref");
      const journal = journalRef ? journalRef.textContent.trim() : "";

      html += `
        <div class="paper">
          <div class="title"><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></div>
          <div class="meta">Autores: ${authorsHTML}</div>
          <div class="meta">Publicado em: ${published}</div>
          ${journal ? `<div class="meta">${journal}</div>` : ""}
        </div>
      `;
    });

    resultsDiv.innerHTML = html || "Nenhum artigo de 2026 encontrado.";
  } catch (error) {
    console.error(error);
    resultsDiv.innerHTML = "Erro ao carregar os dados: " + (error.message || "Failed to fetch");
  }
}

carregarResultados();