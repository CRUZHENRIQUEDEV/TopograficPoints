# Versão: 3.0
"""
Script que busca PÁGINAS (cards) diretamente ao invés de consultar databases.
Funciona com linked databases e múltiplas fontes de dados.
"""

import os
from typing import Dict, List, Tuple
from notion_client import Client
from dotenv import load_dotenv


class NotionVinculadorPaginas:
    """Vinculador que trabalha buscando páginas diretamente."""
    
    def __init__(self, token: str):
        print("\n🔧 INICIALIZANDO VINCULADOR (MODO PÁGINAS)...")
        print(f"🔑 Token: {token[:20]}...{token[-10:]}")
        
        self.notion = Client(auth=token)
        self.campo_codigo = "CODIGO"
        self.campo_relation = "BASE_OAE_ANTIGA"
        
        print(f"✅ Cliente Notion inicializado")
        print(f"🏷️ Campo de comparação: '{self.campo_codigo}'")
        print(f"🔗 Campo relation: '{self.campo_relation}'")
        print("-" * 60)
    
    def buscar_todas_paginas(self) -> List[Dict]:
        """Busca TODAS as páginas acessíveis."""
        todas_paginas = []
        has_more = True
        start_cursor = None
        
        print(f"\n🔍 BUSCANDO TODAS AS PÁGINAS...")
        
        while has_more:
            try:
                response = self.notion.search(
                    filter={"property": "object", "value": "page"},
                    start_cursor=start_cursor,
                    page_size=100
                )
                
                resultados = response.get("results", [])
                todas_paginas.extend(resultados)
                has_more = response.get("has_more", False)
                start_cursor = response.get("next_cursor")
                
                print(f"   📄 Total acumulado: {len(todas_paginas)} páginas")
                
            except Exception as e:
                print(f"   ❌ Erro: {e}")
                break
        
        print(f"✅ Total: {len(todas_paginas)} páginas encontradas")
        return todas_paginas
    
    def filtrar_por_campo(self, paginas: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Separa páginas entre fonte e destino baseado no campo relation.
        """
        print("\n📊 SEPARANDO PÁGINAS...")
        
        paginas_fonte = []  # Não tem BASE_OAE_ANTIGA
        paginas_destino = []  # Tem BASE_OAE_ANTIGA
        
        for pagina in paginas:
            properties = pagina.get("properties", {})
            
            # Verificar se tem o campo CODIGO
            tem_codigo = self.campo_codigo in properties
            
            if not tem_codigo:
                continue  # Pular páginas que não têm CODIGO
            
            # Verificar se tem o campo relation
            tem_relation = self.campo_relation in properties
            
            if tem_relation:
                paginas_destino.append(pagina)
            else:
                paginas_fonte.append(pagina)
        
        print(f"✅ Páginas FONTE (sem relation): {len(paginas_fonte)}")
        print(f"✅ Páginas DESTINO (com relation): {len(paginas_destino)}")
        
        return paginas_fonte, paginas_destino
    
    @staticmethod
    def extrair_codigo(pagina: Dict, campo_nome: str) -> str:
        """Extrai o valor do campo CODIGO."""
        try:
            properties = pagina.get("properties", {})
            campo = properties.get(campo_nome, {})
            
            if not campo:
                return ""
            
            tipo = campo.get("type", "")
            
            if tipo == "title":
                title_array = campo.get("title", [])
                if title_array:
                    return title_array[0].get("plain_text", "").strip()
            elif tipo == "rich_text":
                rich_text_array = campo.get("rich_text", [])
                if rich_text_array:
                    return rich_text_array[0].get("plain_text", "").strip()
            elif tipo == "number":
                numero = campo.get("number")
                return str(numero) if numero is not None else ""
            
            return ""
        except Exception:
            return ""
    
    def criar_dicionario(self, paginas: List[Dict]) -> Dict[str, str]:
        """Cria dicionário CODIGO -> page_id."""
        dicionario = {}
        
        print("\n📚 Criando dicionário de códigos...")
        
        for pagina in paginas:
            codigo = self.extrair_codigo(pagina, self.campo_codigo)
            page_id = pagina.get("id", "")
            
            if codigo and page_id:
                if codigo in dicionario:
                    print(f"   ⚠️ CODIGO duplicado: {codigo}")
                else:
                    dicionario[codigo] = page_id
        
        print(f"✅ Dicionário com {len(dicionario)} códigos únicos")
        return dicionario
    
    def vincular_pagina(self, page_id: str, page_id_fonte: str) -> bool:
        """Vincula uma página."""
        try:
            self.notion.pages.update(
                page_id=page_id,
                properties={
                    self.campo_relation: {
                        "relation": [{"id": page_id_fonte}]
                    }
                }
            )
            return True
        except Exception as e:
            print(f"      ❌ Erro: {str(e)}")
            return False
    
    def executar_vinculacao(self) -> Tuple[int, int, List[str]]:
        """Executa a vinculação completa."""
        print("\n" + "="*60)
        print("🚀 INICIANDO PROCESSO DE VINCULAÇÃO")
        print("="*60)
        
        # Buscar todas as páginas
        todas_paginas = self.buscar_todas_paginas()
        
        if not todas_paginas:
            print("\n❌ Nenhuma página encontrada!")
            return 0, 0, []
        
        # Separar fonte e destino
        paginas_fonte, paginas_destino = self.filtrar_por_campo(todas_paginas)
        
        if not paginas_fonte:
            print("\n❌ ERRO: Nenhuma página fonte encontrada")
            print("   Verifique se as páginas têm o campo 'CODIGO'")
            return 0, 0, []
        
        if not paginas_destino:
            print("\n❌ ERRO: Nenhuma página destino encontrada")
            print("   Verifique se as páginas têm o campo 'BASE_OAE_ANTIGA'")
            return 0, 0, []
        
        # Criar dicionário
        dicionario = self.criar_dicionario(paginas_fonte)
        
        if not dicionario:
            print("\n❌ ERRO: Dicionário vazio")
            return 0, 0, []
        
        # Vincular
        print("\n🔗 VINCULANDO PÁGINAS...")
        print("-" * 60)
        
        total = 0
        vinculados = 0
        nao_encontrados = []
        
        for idx, pagina in enumerate(paginas_destino, 1):
            total += 1
            codigo = self.extrair_codigo(pagina, self.campo_codigo)
            
            if not codigo:
                print(f"   [{idx}/{len(paginas_destino)}] ⚠️ Sem CODIGO")
                continue
            
            if codigo in dicionario:
                page_id_fonte = dicionario[codigo]
                print(f"   [{idx}/{len(paginas_destino)}] 🔗 Vinculando '{codigo}'...", end=" ")
                
                sucesso = self.vincular_pagina(pagina.get("id"), page_id_fonte)
                
                if sucesso:
                    vinculados += 1
                    print("✅")
                else:
                    print("❌")
            else:
                nao_encontrados.append(codigo)
                print(f"   [{idx}/{len(paginas_destino)}] ⚠️ '{codigo}' não encontrado na fonte")
        
        return total, vinculados, nao_encontrados
    
    @staticmethod
    def exibir_relatorio(total: int, vinculados: int, nao_encontrados: List[str]):
        """Exibe relatório final."""
        print("\n" + "="*60)
        print("📊 RELATÓRIO FINAL")
        print("="*60)
        print(f"\n📦 Total processados: {total}")
        print(f"✅ Vinculados com sucesso: {vinculados}")
        print(f"⚠️ Não encontrados na fonte: {len(nao_encontrados)}")
        
        if nao_encontrados:
            print(f"\n📋 Códigos não encontrados (primeiros 20):")
            for codigo in nao_encontrados[:20]:
                print(f"   • {codigo}")
            if len(nao_encontrados) > 20:
                print(f"   ... e mais {len(nao_encontrados) - 20} códigos")
        
        print("\n" + "="*60)
        
        if vinculados == total and total > 0:
            print("🎉 SUCESSO TOTAL! Todos os cards foram vinculados!")
        elif vinculados > 0:
            percentual = (vinculados / total) * 100
            print(f"✅ Vinculação parcial: {percentual:.1f}% concluído")
        else:
            print("❌ Nenhum card foi vinculado.")
        
        print("="*60 + "\n")


def main():
    """Função principal."""
    print("\n" + "="*60)
    print("🎬 VINCULAR NOTION - VERSÃO 3.0 (BUSCA POR PÁGINAS)")
    print("="*60)
    
    load_dotenv()
    token = os.getenv("NOTION_TOKEN")
    
    if not token:
        print("\n❌ ERRO: NOTION_TOKEN não encontrado no .env")
        return
    
    try:
        vinculador = NotionVinculadorPaginas(token)
        total, vinculados, nao_encontrados = vinculador.executar_vinculacao()
        NotionVinculadorPaginas.exibir_relatorio(total, vinculados, nao_encontrados)
        
    except Exception as e:
        print(f"\n❌ ERRO CRÍTICO: {type(e).__name__}")
        print(f"   {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()