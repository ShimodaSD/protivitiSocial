﻿import fs = require("fs");
import moment = require("moment");
import path = require("path");
import Arquivo = require("./arquivo");

export = class FS {
	public static readonly appPath = path.dirname(require.main.filename);
	private static readonly barra = /\//g;
	private static readonly barraInvertida = /\\/g;

	private static ajustarCaminhoRelativo(caminhoRelativo: string, barrasValidas: boolean): string {
		if (!caminhoRelativo ||
			caminhoRelativo.charAt(0) === "." ||
			caminhoRelativo.indexOf("..") >= 0 ||
			caminhoRelativo.indexOf("*") >= 0 ||
			caminhoRelativo.indexOf("?") >= 0 ||
			(!barrasValidas && (caminhoRelativo.indexOf("\\") >= 0 || caminhoRelativo.indexOf("/") >= 0)))
			throw new Error("Caminho inválido");

		return ((path.sep === "/") ?
			caminhoRelativo.replace(FS.barraInvertida, "/") :
			caminhoRelativo.replace(FS.barra, "\\"));
	}

	public static async criarDiretorio(caminhoRelativo: string): Promise<void> {
		caminhoRelativo = FS.ajustarCaminhoRelativo(caminhoRelativo, true);

		return new Promise<void>((resolve, reject) => {
			try {
				fs.mkdir(path.join(FS.appPath, caminhoRelativo), 0o777, (err) => {
					if (err)
						reject(err);
					else
						resolve();
				});
			} catch (e) {
				reject(e);
			}
		});
	}

	public static async listarDiretorio(caminhoRelativo: string): Promise<Arquivo[]> {
		caminhoRelativo = FS.ajustarCaminhoRelativo(caminhoRelativo, true);

		return new Promise<Arquivo[]>((resolve, reject) => {
			try {
				let dir = path.join(FS.appPath, caminhoRelativo);

				fs.readdir(dir, (err, files) => {
					if (err) {
						reject(err);
						return;
					}

					if (!files || !files.length) {
						resolve([]);
						return;
					}

					let arquivos: Arquivo[] = new Array(files.length);

					function processarProximo(i: number) {
						try {
							if (i >= arquivos.length) {
								resolve(arquivos);
								return;
							}

							fs.stat(path.join(dir, files[i]), (err, stats) => {
								if (err) {
									reject(err);
									return;
								}

								let a = new Arquivo();
								a.nome = files[i];
								a.tamanho = stats.size;
								a.modificacaoMs = stats.mtimeMs;
								// http://momentjs.com/docs/#/displaying/
								a.modificacao = moment(stats.mtime).locale("pt-br").format("DD/MM/YYYY HH:mm");
								arquivos[i] = a;

								processarProximo(i + 1);
							});
						} catch (e) {
							reject(e);
						}
					}

					processarProximo(0);
				});
			} catch (e) {
				reject(e);
			}
		});
	}

	public static async excluirArquivosEDiretorio(caminhoRelativo: string): Promise<void> {
		caminhoRelativo = FS.ajustarCaminhoRelativo(caminhoRelativo, true);

		return new Promise<void>((resolve, reject) => {
			try {
				let dir = path.join(FS.appPath, caminhoRelativo);

				fs.readdir(dir, (err, files) => {
					if (err) {
						reject(err);
						return;
					}

					function excluirProximo(i: number) {
						try {
							if (!files || i >= files.length) {
								fs.rmdir(dir, (err) => {
									if (err)
										reject(err);
									else
										resolve();
								});
								return;
							}

							fs.unlink(path.join(dir, files[i]), (err) => {
								if (err) {
									reject(err);
									return;
								}
								excluirProximo(i + 1);
							});
						} catch (e) {
							reject(e);
						}
					}

					excluirProximo(0);
				});
			} catch (e) {
				reject(e);
			}
		});
	}

	public static async renomearArquivo(caminhoRelativoAtual: string, caminhoRelativoNovo: string): Promise<void> {
		caminhoRelativoAtual = FS.ajustarCaminhoRelativo(caminhoRelativoAtual, true);
		caminhoRelativoNovo = FS.ajustarCaminhoRelativo(caminhoRelativoNovo, true);

		return new Promise<void>((resolve, reject) => {
			try {
				fs.rename(path.join(FS.appPath, caminhoRelativoAtual), path.join(FS.appPath, caminhoRelativoNovo), (err) => {
					if (err)
						reject(err);
					else
						resolve();
				});
			} catch (e) {
				reject(e);
			}
		});
	}

	public static async excluirArquivo(caminhoRelativo: string): Promise<void> {
		caminhoRelativo = FS.ajustarCaminhoRelativo(caminhoRelativo, true);

		return new Promise<void>((resolve, reject) => {
			try {
				fs.unlink(path.join(FS.appPath, caminhoRelativo), (err) => {
					if (err)
						reject(err);
					else
						resolve();
				});
			} catch (e) {
				reject(e);
			}
		});
	}
}
