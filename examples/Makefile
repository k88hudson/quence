ARROW = ../bin/quence.js
SRCS = $(wildcard *.wsd)
JSONS = ${SRCS:.wsd=.json}
SVGS = ${SRCS:.wsd=.svg}

.SUFFIXES:
.SUFFIXES: .wsd .json .svg

all: $(JSONS) $(SVGS)

clean:
	-$(RM) *.json *.svg

.wsd.json :
	$(ARROW) -o json $<

.wsd.svg :
	$(ARROW) -o svg $<
