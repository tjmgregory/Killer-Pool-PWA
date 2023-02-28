variable "release_version" {
  type = string
}

variable "push_public" {
  type      = string
  sensitive = true
}

variable "push_private" {
  type      = string
  sensitive = true
}
