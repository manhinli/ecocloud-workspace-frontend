# Copyright 2017 The Kubernetes Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

.PHONY:	build push test

PREFIX = hub.bccvl.org.au/ecocloud
IMAGE = workspace-ui
TAG = latest

build:
	docker build -t $(PREFIX)/$(IMAGE):$(TAG) .

test:
	docker run --rm -it -p 5000:80 $(PREFIX)/$(IMAGE):$(TAG)

run:
	docker run --rm -it -p 5000:5000 -v $(PWD):/code $(PREFIX)/$(IMAGE):$(TAG) bash

dist:
	docker run --rm -it -v $(PWD):/code $(PREFIX)/$(IMAGE):$(TAG) yarn build

yarn:
	docker run --rm -it -v $(PWD):/code $(PREFIX)/$(IMAGE):$(TAG) yarn

start:
	docker run --rm -it -p 5000:5000 -v $(PWD):/code $(PREFIX)/$(IMAGE):$(TAG) yarn start

push:
	docker push $(PREFIX)/$(IMAGE):$(TAG)