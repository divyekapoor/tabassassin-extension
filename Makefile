all: zipfile


zipfile: clean
	zip -r tabassassin.zip tabassassin/
	zip -d tabassassin.zip tabassassin/promotional/

clean:
	$(RM) tabassassin.zip

.PHONY: clean
