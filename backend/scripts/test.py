from goatools.base import download_go_basic_obo
from goatools.obo_parser import GODag
from goatools.associations import read_gaf

download_go_basic_obo("go-basic.obo")
obodag = GODag("go-basic.obo")
associations = read_gaf("goa_human.gaf")

go_id = "GO:0038201"
genes = [gene for gene, terms in associations.items() if go_id in terms]

print(f"GO Term: {go_id}")
print(f"Genes ({len(genes)}): {genes[:15]} ...")
