#[tokio::main]
pub async fn main() -> anyhow::Result<()> {
    let result = reqwest::get(
        "https://raw.githubusercontent.com/googleapis/nodejs-firestore/main/types/firestore.d.ts",
    )
    .await?
    .text()
    .await?;

    let comments = swc_common::comments::SingleThreadedComments::default();
    let lexer = swc_ecma_parser::lexer::Lexer::new(
        swc_ecma_parser::Syntax::Typescript(swc_ecma_parser::TsConfig {
            tsx: false,
            decorators: false,
            dts: true,
            no_early_errors: true,
        }),
        swc_ecma_ast::EsVersion::Es2022,
        swc_ecma_parser::StringInput::new(
            &result,
            swc_common::source_map::BytePos(0),
            swc_common::source_map::BytePos((result.as_bytes().len() - 1) as u32),
        ),
        Some(&comments),
    );
    let mut parser = swc_ecma_parser::Parser::new_from(lexer);
    let module = parser.parse_module().map_err(|_| Error::ParseModuleError)?;
    let errors = parser.take_errors();

    println!("error {:#?}", errors);

    let first_module_item = module.body.first().ok_or(Error::NotFoundModule)?;

    let first_module_body = first_module_item
        .clone()
        .expect_stmt()
        .expect_decl()
        .expect_ts_module()
        .body
        .ok_or(Error::FirstModuleBodyNotFound)?;

    let first_module_block = first_module_body
        .as_ts_module_block()
        .ok_or(Error::FirstModuleBodyNotFound)?;

    println!("{}", first_module_block.body.len());

    let cm = std::sync::Arc::<swc_common::SourceMap>::default();
    let mut buf = vec![];
    let writer = swc_ecma_codegen::text_writer::JsWriter::new(cm.clone(), "\n", &mut buf, None);

    let mut emitter = swc_ecma_codegen::Emitter {
        cfg: Default::default(),
        comments: None,
        cm: cm.clone(),
        wr: writer,
    };

    swc_ecma_codegen::Node::emit_with(&module, &mut emitter)?;

    let code = String::from_utf8(buf).expect("invalid utf8 character detected");

    let _ = std::fs::write("./out.ts", code)?;

    Ok(())
}

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("parse module error")]
    ParseModuleError,

    #[error("module not found")]
    NotFoundModule,

    #[error("first module body not found")]
    FirstModuleBodyNotFound,
}
