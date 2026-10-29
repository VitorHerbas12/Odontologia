/**
 * TreatmentFilters - Grade Completa de Tratamentos com Filtros por Especialidade
 * Consultório Dr. Kenny Freitas · Jardins, São Paulo
 *
 * Funcionalidades:
 * - Filtros rápidos por especialidade clínica (Todos, Implantes, Cirurgia & Siso, Estética & Lentes, Clareamento, Canal/Endodontia, Prevenção & Cárie)
 * - Busca inteligente por sintomas ou termos (ex: dor, siso, clareamento, mancha, implante)
 * - Grade completa de cards ricos com diagnóstico, indicações clínicas, tempo de sessão, nível de conforto
 * - Botão de agendamento via WhatsApp direto com mensagem pré-configurada por procedimento
 * - Modal / Painel de detalhes aprofundados sobre o procedimento passo a passo
 * - Totalmente integrado ao design token do site e respeitando prefers-reduced-motion
 */

(function () {
  const CATEGORIES = [
    { id: "todos", label: "Todos os tratamentos" },
    { id: "implantes", label: "Implantes & Próteses" },
    { id: "cirurgia", label: "Cirurgia Oral & Siso" },
    { id: "estetica", label: "Estética & Facetas" },
    { id: "clareamento", label: "Clareamento" },
    { id: "endodontia", label: "Canal & Endodontia" },
    { id: "prevencao", label: "Prevenção & Cárie" },
  ];

  const TREATMENTS = [
    {
      id: "implante-guiado",
      category: "implantes",
      categoryLabel: "Reabilitação Oral",
      title: "Implante Dentário Guiado",
      badge: "Alta Precisão",
      summary:
        "Substituição de dentes perdidos por implantes de titânio biocompatível com planejamento tomográfico tridimensional e guia cirúrgico computadorizado.",
      indication: "Perda de um ou mais dentes, dificuldade mastigatória ou substituição de próteses móveis.",
      duration: "1 a 2 sessões para instalação + período de osseointegração",
      comfort: "Anestesia local computadorizada · Opção de sedação consciente",
      steps: [
        "Tomografia 3D e escaneamento intraoral para planejamento milimétrico",
        "Confecção do guia cirúrgico personalizado sem cortes extensos",
        "Instalação do implante com mínima intervenção tecidual",
        "Colocação de coroa provisória ou definitiva de zircônia",
      ],
      whatsappMsg: "Olá! Gostaria de agendar uma avaliação para Implante Dentário Guiado com o Dr. Kenny Freitas.",
    },
    {
      id: "protese-zirconia",
      category: "implantes",
      categoryLabel: "Prótese Dentária",
      title: "Prótese Fixa e Coroa em Zircônia",
      badge: "Estética & Função",
      summary:
        "Reconstrução protética livre de metal com zircônia translúcida e cerâmica alemã, com boa resistência à mastigação e translucidez próxima à do dente natural.",
      indication: "Dentes amplamente destruídos, desgastados ou finalização estética sobre implantes.",
      duration: "2 a 3 consultas planejadas",
      comfort: "Procedimento com foco no conforto, com anestesia local quando necessária",
      steps: [
        "Preparo dental minimamente invasivo ou moldagem digital do implante",
        "Design digital CAD/CAM das margens gengivais e oclusão",
        "Prova de adaptação milimétrica, cor e translucidez",
        "Cimentação adesiva definitiva de alta estabilidade",
      ],
      whatsappMsg: "Olá! Tenho interesse em Prótese Fixa e Coroa em Zircônia. Gostaria de agendar uma consulta.",
    },
    {
      id: "extracao-siso",
      category: "cirurgia",
      categoryLabel: "Cirurgia Oral Menor",
      title: "Extração de Siso Atraumática",
      badge: "Recuperação Rápida",
      summary:
        "Remoção planejada de terceiros molares inclusos, semi-inclusos ou impactados, com protocolo anti-inflamatório preventivo para pós-operatório confortável e sem inchaço.",
      indication: "Falta de espaço na arcada, dor, infecção pericoronária, apinhamento ou preparo ortodôntico.",
      duration: "Aproximadamente 40 a 60 minutos",
      comfort: "Anestesia local profunda e protocolo de laserterapia pós-cirúrgica",
      steps: [
        "Análise tomográfica da posição das raízes e proximidade com o nervo",
        "Medicação profilática pré-operatória personalizada",
        "Cirurgia minimamente invasiva com instrumentos delicados",
        "Acompanhamento cicatricial e suporte direto pós-operatório",
      ],
      whatsappMsg: "Olá! Gostaria de agendar uma avaliação para extração de dente do siso com o Dr. Kenny Freitas.",
    },
    {
      id: "enxerto-osseo-gengival",
      category: "cirurgia",
      categoryLabel: "Regeneração Tecidual",
      title: "Enxerto Ósseo e Plástica Gengival",
      badge: "Bioengenharia",
      summary:
        "Reconstituição de volume ósseo reabsorvido e recobrimento de raízes expostas, restabelecendo a base estrutural para implantes e a harmonia da linha do sorriso.",
      indication: "Perda de espessura óssea pós-extração, retrações gengivais severas e sensibilidade radicular.",
      duration: "1 sessão cirúrgica com acompanhamento evolutivo",
      comfort: "Técnicas microcirúrgicas e biomateriais de alto padrão",
      steps: [
        "Mapeamento digital da perda tecidual e densidade óssea",
        "Aplicação de biomateriais e membranas regenerativas",
        "Sutura microcirúrgica com fios atraumáticos ultrafinos",
        "Revisão periódica com controle fotográfico e radiográfico",
      ],
      whatsappMsg: "Olá! Gostaria de saber mais e agendar uma avaliação para Enxerto Ósseo / Gengival.",
    },
    {
      id: "lentes-facetas",
      category: "estetica",
      categoryLabel: "Estética Avançada",
      title: "Lentes de Contato e Facetas Cerâmicas",
      badge: "Design do Sorriso",
      summary:
        "Lâminas de porcelana ultrafinas (0,2 a 0,5 mm) personalizadas para transformar cor, formato, textura e alinhamento dos dentes com preservação da estrutura natural do dente.",
      indication: "Dentes escurecidos, com restaurações antigas, diastemas (espaços) ou desgastes assimétricos.",
      duration: "3 a 4 consultas (planejamento, mockup estético e cimentação)",
      comfort: "Preparo ultraconservador, muitas vezes sem necessidade de anestesia",
      steps: [
        "Fotografia digital e planejamento do sorriso de acordo com a face (DSD)",
        "Mockup em resina (teste do novo sorriso na boca antes de qualquer preparo)",
        "Micro-desgaste guiado com magnificação visual",
        "Cimentação definitiva com adesivos fotoativados de alta longevidade",
      ],
      whatsappMsg: "Olá! Gostaria de fazer uma avaliação para Lentes de Contato / Facetas de Porcelana com o Dr. Kenny Freitas.",
    },
    {
      id: "restauracao-estetica",
      category: "estetica",
      categoryLabel: "Dentística Conservadora",
      title: "Restauração Estética e Troca de Amálgama",
      badge: "Mimética Natural",
      summary:
        "Reconstrução anatômica com resinas compostas nanoparticuladas de última geração, reproduzindo com fidelidade a fluorescência, translucidez e os sulcos naturais do dente.",
      indication: "Substituição de restaurações metálicas escuras, fraturas ou cáries ativas.",
      duration: "1 consulta por elemento (40 a 60 minutos)",
      comfort: "Isolamento absoluto para biossegurança e conforto total",
      steps: [
        "Remoção seletiva do tecido danificado ou do metal antigo",
        "Estratificação de resina em camadas anatômicas de dentina e esmalte",
        "Caracterização óptica dos sulcos e fossas oclusais",
        "Polimento diamantado de alto brilho e ajuste oclusal",
      ],
      whatsappMsg: "Olá! Gostaria de agendar uma consulta para Restauração Estética / Revisão de Restaurações.",
    },
    {
      id: "clareamento-clinico",
      category: "clareamento",
      categoryLabel: "Clareamento Supervisionado",
      title: "Clareamento Conjugado (Laser + Moldeira)",
      badge: "Seguro & Eficaz",
      summary:
        "Combinação de sessões no consultório ativadas por luz LED/Laser com protocolo domiciliar seguro em moldeiras sob medida, alcançando até 6 tons de clareamento sem sensibilidade.",
      indication: "Dentes amarelados, manchas de café, chá, vinho ou escurecimento fisiológico pelo tempo.",
      duration: "2 a 3 semanas de tratamento",
      comfort: "Gel clareador enriquecido com nitrato de potássio e flúor dessensibilizante",
      steps: [
        "Avaliação da saúde gengival e registro fotográfico da cor inicial",
        "Sessão clínica de alta potência com proteção gengival fotopolimerizável",
        "Escaneamento para confecção das moldeiras de silicone flexível",
        "Acompanhamento da evolução com registro da escala de cor alcançada",
      ],
      whatsappMsg: "Olá! Tenho interesse no Clareamento Dental Conjugado do Dr. Kenny Freitas. Gostaria de agendar.",
    },
    {
      id: "tratamento-canal",
      category: "endodontia",
      categoryLabel: "Endodontia Microscópica",
      title: "Tratamento de Canal em Sessão Única",
      badge: "Alívio Imediato",
      summary:
        "Desinfecção minuciosa do sistema de canais radiculares com auxílio de microscopia operatória e instrumentos rotatórios de níquel-titânio flexível, salvando o dente da extração.",
      indication: "Dor de dente aguda, sensibilidade persistente ao quente/frio, cárie profunda ou trauma.",
      duration: "Sessão única de 60 a 90 minutos na grande maioria dos casos",
      comfort: "Anestesia local profunda guiada, sem dor durante todo o procedimento",
      steps: [
        "Localização milimétrica dos ápices com localizador apical eletrônico",
        "Limpeza biomecânica com irrigação ultrassônica ativada (PUI)",
        "Obturação tridimensional dos condutos com cones biocerâmicos",
        "Selamento coronário imediato para proteção contra reinfecção",
      ],
      whatsappMsg: "Olá! Gostaria de agendar uma avaliação para Tratamento de Canal / Alívio de dor de dente com o Dr. Kenny Freitas.",
    },
    {
      id: "prevencao-periodontia",
      category: "prevencao",
      categoryLabel: "Checkup & Prevenção",
      title: "Profilaxia com Ultrassom & Prevenção",
      badge: "Saúde Integral",
      summary:
        "Limpeza clínica profunda com remoção de placa bacteriana e tártaro subgengival através de ultrassom piezoelétrico suave e jato de bicarbonato/glicina micropulverizada.",
      indication: "Prevenção semestral obrigatória, sangramento gengival, gengivite, mau hálito ou tártaro.",
      duration: "Sessão de 45 a 60 minutos",
      comfort: "Procedimento rápido, refrescante e não doloroso",
      steps: [
        "Sondagem periodontal diagnóstica dente a dente",
        "Raspagem ultrassônica suave sem agredir o esmalte",
        "Jato de glicina para polimento e remoção de manchas extrínsecas",
        "Aplicação tópica de flúor remineralizante e orientação de higiene",
      ],
      whatsappMsg: "Olá! Gostaria de agendar um Check-up Preventivo / Profilaxia com o Dr. Kenny Freitas.",
    },
  ];

  function TreatmentFilters() {
    const { useState, useMemo } = React;
    const [selectedCategory, setSelectedCategory] = useState("todos");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDetailId, setActiveDetailId] = useState(null);

    // Filtragem combinada por categoria e termo de busca
    const filteredTreatments = useMemo(() => {
      return TREATMENTS.filter((item) => {
        const matchesCategory =
          selectedCategory === "todos" || item.category === selectedCategory;

        const term = searchTerm.trim().toLowerCase();
        if (!term) return matchesCategory;

        const matchesSearch =
          item.title.toLowerCase().includes(term) ||
          item.summary.toLowerCase().includes(term) ||
          item.indication.toLowerCase().includes(term) ||
          item.categoryLabel.toLowerCase().includes(term);

        return matchesCategory && matchesSearch;
      });
    }, [selectedCategory, searchTerm]);

    const activeDetailTreatment = useMemo(() => {
      return TREATMENTS.find((t) => t.id === activeDetailId) || null;
    }, [activeDetailId]);

    // Contadores por categoria
    const categoryCounts = useMemo(() => {
      const counts = { todos: TREATMENTS.length };
      CATEGORIES.forEach((cat) => {
        if (cat.id !== "todos") {
          counts[cat.id] = TREATMENTS.filter((t) => t.category === cat.id).length;
        }
      });
      return counts;
    }, []);

    return React.createElement(
      "div",
      { className: "tf-container" },

      // Barra Superior de Controles: Busca e Chips de Categorias
      React.createElement(
        "div",
        { className: "tf-controls" },

        // Campo de busca inteligente
        React.createElement(
          "div",
          { className: "tf-search-wrap" },
          React.createElement("input", {
            type: "text",
            className: "tf-search-input",
            placeholder: "Buscar por tratamento, sintoma ou queixa (ex: siso, dor, implante, mancha)...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            "aria-label": "Buscar tratamentos",
          }),
          searchTerm &&
            React.createElement(
              "button",
              {
                type: "button",
                className: "tf-search-clear",
                onClick: () => setSearchTerm(""),
                "aria-label": "Limpar busca",
              },
              "✕"
            )
        ),

        // Barra de Filtros por Especialidade (Chips)
        React.createElement(
          "div",
          { className: "tf-chips-bar", role: "tablist", "aria-label": "Especialidades clínicas" },
          CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return React.createElement(
              "button",
              {
                key: cat.id,
                type: "button",
                role: "tab",
                "aria-selected": isActive ? "true" : "false",
                className: "tf-chip" + (isActive ? " is-active" : ""),
                onClick: () => {
                  setSelectedCategory(cat.id);
                },
              },
              cat.label,
              React.createElement("span", { className: "tf-chip-count" }, count)
            );
          })
        )
      ),

      // Grade Completa de Cards de Tratamentos
      filteredTreatments.length > 0
        ? React.createElement(
            "div",
            { className: "tf-cards-grid" },
            filteredTreatments.map((treatment, index) => {
              const isSelected = activeDetailId === treatment.id;
              const waLink = `https://wa.me/5511900000000?text=${encodeURIComponent(treatment.whatsappMsg)}`;
              const staggerDelay = Math.min(index * 65, 420);

              return React.createElement(
                "article",
                {
                  key: treatment.id,
                  className: "tf-card" + (isSelected ? " is-expanded" : ""),
                  style: {
                    animationDelay: `${staggerDelay}ms`,
                  },
                  onClick: () => {
                    setActiveDetailId(isSelected ? null : treatment.id);
                  },
                },
                // Cabeçalho do Card
                React.createElement(
                  "div",
                  { className: "tf-card-header" },
                  React.createElement(
                    "span",
                    { className: "tf-card-badge" },
                    React.createElement("span", { className: "tf-card-dot" }),
                    treatment.categoryLabel
                  ),
                  React.createElement(
                    "span",
                    { className: "tf-card-pill" },
                    treatment.badge
                  )
                ),

                // Título
                React.createElement("h3", { className: "tf-card-title" }, treatment.title),

                // Resumo
                React.createElement("p", { className: "tf-card-summary" }, treatment.summary),

                // Informações Clínicas Destacadas
                React.createElement(
                  "div",
                  { className: "tf-card-meta" },
                  React.createElement(
                    "div",
                    { className: "tf-meta-row" },
                    React.createElement("span", { className: "tf-meta-label" }, "Indicação:"),
                    React.createElement("span", { className: "tf-meta-val" }, treatment.indication)
                  ),
                  React.createElement(
                    "div",
                    { className: "tf-meta-row" },
                    React.createElement("span", { className: "tf-meta-label" }, "Duração média:"),
                    React.createElement("span", { className: "tf-meta-val" }, treatment.duration)
                  ),
                  React.createElement(
                    "div",
                    { className: "tf-meta-row" },
                    React.createElement("span", { className: "tf-meta-label" }, "Conforto:"),
                    React.createElement("span", { className: "tf-meta-val" }, treatment.comfort)
                  )
                ),

                // Etapas do Procedimento (quando expandido ou detalhado)
                isSelected &&
                  React.createElement(
                    "div",
                    { className: "tf-card-steps" },
                    React.createElement("h4", { className: "tf-steps-title" }, "Como funciona o tratamento passo a passo:"),
                    React.createElement(
                      "ol",
                      { className: "tf-steps-list" },
                      treatment.steps.map((st, i) =>
                        React.createElement("li", { key: i }, st)
                      )
                    )
                  ),

                // Rodapé com Ações
                React.createElement(
                  "div",
                  {
                    className: "tf-card-footer",
                    onClick: (e) => e.stopPropagation(),
                  },
                  React.createElement(
                    "a",
                    {
                      className: "tf-cta-btn",
                      href: waLink,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      "aria-label": `Agendar avaliação para ${treatment.title}`,
                    },
                    "Agendar consulta",
                    React.createElement("span", { "aria-hidden": "true" }, "→")
                  ),
                  React.createElement(
                    "button",
                    {
                      type: "button",
                      className: "tf-toggle-btn",
                      onClick: (e) => {
                        e.stopPropagation();
                        setActiveDetailId(isSelected ? null : treatment.id);
                      },
                    },
                    isSelected ? "Menos detalhes" : "Ver etapas passo a passo"
                  )
                )
              );
            })
          )
        : React.createElement(
            "div",
            { className: "tf-empty-state" },
            React.createElement("p", { className: "tf-empty-title" }, "Nenhum tratamento encontrado para essa busca."),
            React.createElement("p", { className: "tf-empty-desc" }, "Tente buscar por termos como 'siso', 'implante', 'canal' ou limpe os filtros."),
            React.createElement(
              "button",
              {
                type: "button",
                className: "tf-chip is-active",
                style: { marginTop: "16px" },
                onClick: () => {
                  setSelectedCategory("todos");
                  setSearchTerm("");
                },
              },
              "Ver todos os tratamentos"
            )
          )
    );
  }

  window.TreatmentFilters = TreatmentFilters;
})();
