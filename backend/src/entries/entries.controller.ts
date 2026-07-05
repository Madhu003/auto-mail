import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEntryDto) {
    return this.entriesService.createEntry(dto.rawPostText);
  }

  @Get()
  findAll() {
    return this.entriesService.listEntries();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.entriesService.getEntry(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEntryDto) {
    return this.entriesService.updateEntry(id, dto);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.ACCEPTED)
  sendOne(@Param('id') id: string) {
    return this.entriesService.sendOne(id);
  }

  @Post('send-all')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendAll() {
    const triggered = await this.entriesService.sendAll();
    return { triggered };
  }

  @Post(':id/regenerate')
  @HttpCode(HttpStatus.ACCEPTED)
  regenerate(@Param('id') id: string) {
    return this.entriesService.regenerate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.entriesService.deleteEntry(id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAll() {
    await this.entriesService.deleteAllEntries();
  }
}
